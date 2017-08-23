/*
 * Copyright © 2014 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * This example is based on the Apache Spark Example MovieLensALS. The original file may be found at
 * https://github.com/apache/spark/blob/master/examples/src/main/scala/org/apache/spark/examples/mllib/
 * MovieLensALS.scala
 *
 * Copyright 2014 The Apache Software Foundation. Licensed under the Apache License, Version 2.0.
 *
 * This application uses MovieLens data set (http://grouplens.org/datasets/movielens/) collected by the
 * GroupLens Research Project at the University of Minnesota.
 */

package co.cask.cdap.apps.movierecommender

import co.cask.cdap.api.common.Bytes
import co.cask.cdap.api.spark.{SparkExecutionContext, SparkMain}
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.slf4j.{Logger, LoggerFactory}
import co.cask.cdap.api.dataset.table.Row
import co.cask.cdap.api.dataset.table
import co.cask.cdap.api.common.Bytes
import co.cask.cdap.api.data.DatasetContext
import co.cask.cdap.api.dataset.lib.ObjectStore
import breeze.linalg.DenseMatrix
import breeze.linalg.cholesky
import breeze.linalg.Axis.{_0, _1}
import breeze.linalg.DenseVector
import breeze.linalg.*
import breeze.stats.distributions.Gaussian
import breeze.math._
import breeze.numerics._
import breeze.optimize._
import breeze.math.Complex
import breeze.optimize.ApproximateGradientFunction
import breeze.optimize.StochasticDiffFunction
import util.control.Breaks

object GaussianProcess {
  var L = new DenseMatrix[Double](0, 0)
  var Xtrain = new DenseMatrix[Double](0, 0)
  var Ytrain = new DenseVector[Double](0)
  var best = 1E200 * 1E200 // Arbitrarily large number

  /**
  Distance between two vector
    **/
  def distance(x: DenseVector[Double], y: DenseVector[Double]): Double = {
    val square = (x - y).t * (x - y)
    sqrt(square)
  }

  /**
  Squared exponential kernel
    **/
  def covariance(x: DenseVector[Double], y: DenseVector[Double]): Double = {
    val pow = -0.5 * distance(x, y)
    exp(pow)
  }

  /**
  Kernel between two dense matrices
    **/
  def kernel(x1: DenseMatrix[Double], x2:DenseMatrix[Double]): DenseMatrix[Double] = {
    val K = DenseMatrix.zeros[Double](x1.cols, x2.cols)

    for(i <- 0 to x1.cols - 1) {
      for(j <- 0 to x2.cols - 1) {
        K(i, j) = covariance(x1(::, i), x2(::, j))
      }
    }
    K
  }

  /**
  Calculate covariance matrix for training data, plus its Cholesky decomposition
    **/
  def train(xtrain: DenseMatrix[Double], ytrain: DenseVector[Double]) = {
    Xtrain = xtrain
    Ytrain = ytrain

    val K = kernel(Xtrain, Xtrain)
    L = cholesky(K)
  }

  /**
  GP regression, given test and training data
    **/
  def predict(x: DenseVector[Double]): (Double, Double) = {

    val Xtest = x.toDenseMatrix.t
    val K_s = kernel(Xtrain, Xtest)
    val v = L \ K_s

    val mu = v.t * (L \ Ytrain)
    val cov = kernel(Xtest, Xtest) - v.t * v

    (mu(0), cov(0, 0))
  }

  /**
  Expected improvement metric for Bayesian Optimization
    Compare with probability of improvement
    **/
  def expectedImprovement(x: DenseVector[Double]): Double = {
    best = breeze.linalg.min(Ytrain.toDenseMatrix)

    val (mu, sigma) = predict(x)

    val g = Gaussian(0, 1)
    val Z = (best - mu) / (sigma + 0.000001)

    g.pdf(Z) + (sigma * Z * g.cdf(Z))
  }

  /**
  Function to be minimized for Bayesian Optimization
    **/
  val objective = new DiffFunction[DenseVector[Double]] {
    def calculate(x: DenseVector[Double]) = {
      val diffg = new ApproximateGradientFunction[Int, DenseVector[Double]](expectedImprovement)
      (-expectedImprovement(x), -diffg.gradientAt(x).toDenseVector)
    }
  }
}

class Optimizer extends SparkMain {
  import Optimizer._

  override def run(implicit sec: SparkExecutionContext) {

    val sc = new SparkContext

    var name = ""
    var numRuns = 0
    var optimizerString = ""

    // Get algorithm name
    val token = sec.getWorkflowToken
    token match {
      case Some(token) =>
        name = token.get("name").toString()
      case None =>
        LOG.debug("No name value")
    }

    Transaction((datasetContext: DatasetContext) => {
      val store: ObjectStore[Instance] = datasetContext.getDataset("Instances")
      val instance = Option(store.read(name))
      instance match {
        case Some(instance) =>
          optimizerString = instance.getOptimizerString()
          numRuns = instance.getNumRuns()
        case None =>
          LOG.debug("No name instance")
      }
    })

    LOG.debug("optimizer " + optimizerString)
    LOG.debug("runs " + numRuns)

    val train_input = optimizerString.split(",").map(_.toDouble)
    val inputSpaceDimension = train_input.length / numRuns
    val train = new DenseMatrix(inputSpaceDimension, numRuns, train_input)
    val Xtrain = train.copy.delete(inputSpaceDimension - 1, breeze.linalg.Axis._0)
    val Ytrain = train(inputSpaceDimension - 1, ::).t

    GaussianProcess.train(Xtrain, Ytrain)

    val n_restarts = 10
    var best_x = Xtrain(::, numRuns - 1)
    var best_acquisition_value = 0.0

    for (i <- 0 to n_restarts - 1) {
      var rand = DenseVector.rand[Double](2)
      rand :*= 2.0
      rand :*= Xtrain(::, numRuns - 1)

      val lbfgs = new LBFGS[DenseVector[Double]](maxIter = 100, m = 3)
      try {
        val optimum = lbfgs.minimize(GaussianProcess.objective, rand)

        val acquisition_value = GaussianProcess.expectedImprovement(optimum)

        if (acquisition_value >  best_acquisition_value) {
          best_acquisition_value = acquisition_value
          best_x = optimum
        }

      } catch {
        case e: breeze.linalg.NotConvergedException =>
          LOG.debug("Iteration " + i + " failed to converge")
      }
    }

    var out = ""
    for (i <- 0 to best_x.length - 1) {
      out = out + best_x(i).toString
      if (i != best_x.length - 1) out = out + ","
    }

    LOG.debug("Ideal params are: " + out)

    Transaction((datasetContext: DatasetContext) => {
      val store: ObjectStore[Instance] = datasetContext.getDataset("Instances")
      val instance = Option(store.read(name))
      instance match {
        case Some(instance) =>
          instance.setNextHyperparameters(out)
          store.write(name, instance)
        case None =>
          LOG.debug("No name instance")
      }
    })
  }
}

object Optimizer {
  val LOG: Logger = LoggerFactory.getLogger(classOf[Optimizer])
}
