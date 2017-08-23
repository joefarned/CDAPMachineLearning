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
import org.apache.spark.mllib.recommendation.{ALS, Rating}
import org.apache.spark.rdd.RDD
import org.slf4j.{Logger, LoggerFactory}
import co.cask.cdap.api.dataset.table.Row
import co.cask.cdap.api.dataset.table
import co.cask.cdap.api.data.DatasetContext

import co.cask.cdap.api.annotation.UseDataSet
import co.cask.cdap.api.dataset.lib.ObjectStore

import scala.util.control.Exception._

class InstanceBuilder extends SparkMain {
  import InstanceBuilder._

  override def run(implicit sec: SparkExecutionContext) {
    val sc = new SparkContext
    var name = ""
    var hyperparameters = ""
    var dataset = ""

    // If token provided, get algorithm name and hyperparameters
    val token = sec.getWorkflowToken
    token match {
      case Some(token) =>
        name = token.get("name").toString()
        hyperparameters = token.get("hyperparameters").toString
        dataset = token.get("dataset").toString
      case None =>
        LOG.debug("No name value")
    }


    // TODO: make this pretty. put into separate functions
    val evaluationDataset = sc.fromDataset[Array[Byte], Row](dataset)

    val rss = evaluationDataset
      .map(x => (x._2.getDouble("y", 0.0), x._2.getDouble("y_hat", 0.0)))
      .map {
        case (y, y_hat) => (y_hat - y) * (y_hat - y)
      }
      .reduce(_ + _)

    val total = evaluationDataset
      .map(x => x._2)
      .map(x => x.getDouble("y", 0.0))
      .reduce(_ + _)

    val count = evaluationDataset.count()

    val mu = total / count

    LOG.debug("total " + total + " count " + count)

    val ess = evaluationDataset
      .map(x => x._2)
      .map(x => (x.getDouble("y", 0), mu))
      .map {
        case (y, mu) => (y - mu) * (y - mu)
      }
      .reduce(_ + _)

    var rsquared = 1 - (rss / ess)
    if (rsquared < 0) {
      rsquared = 0
    }

    LOG.debug("rss " + rss + " ess " + ess + " rsquared" + rsquared)

    Transaction((datasetContext: DatasetContext) => {
      val store: ObjectStore[Instance] = datasetContext.getDataset("Instances")
      val instance = Option(store.read(name))
      instance match {
        case Some(instance) =>
          instance.addRun(hyperparameters, rss, rsquared)
          store.write(name, instance)
        case None =>
          val newInstance = new Instance(name);
          newInstance.addRun(hyperparameters, rss, rsquared)
          store.write(name, newInstance)
      }
    })
  }
}

object InstanceBuilder {
  val LOG: Logger = LoggerFactory.getLogger(classOf[Optimizer])
}
