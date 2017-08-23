/*
 * Copyright © 2014-2015 Cask Data, Inc.
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
 */

package co.cask.cdap.apps.movierecommender;

import co.cask.cdap.api.annotation.UseDataSet;
import co.cask.cdap.api.app.AbstractApplication;
import co.cask.cdap.api.data.schema.UnsupportedTypeException;
import co.cask.cdap.api.dataset.lib.ObjectStores;
import co.cask.cdap.api.service.AbstractService;
import co.cask.cdap.api.service.http.AbstractHttpServiceHandler;
import co.cask.cdap.api.service.http.HttpServiceRequest;
import co.cask.cdap.api.service.http.HttpServiceResponder;
import co.cask.cdap.api.workflow.AbstractWorkflow;
import co.cask.cdap.api.workflow.WorkflowContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import co.cask.cdap.api.workflow.Value;
import co.cask.cdap.api.workflow.WorkflowContext;
import co.cask.cdap.api.workflow.WorkflowToken;

import co.cask.cdap.api.dataset.lib.ObjectStore;
import java.net.HttpURLConnection;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import java.util.Map;

/**
 * Application that provides movie recommendations to users.
 */
public class MachineLearningApp extends AbstractApplication {

  private static final Logger LOG = LoggerFactory.getLogger(MachineLearningApp.class);

  @Override
  public void configure() {
    setName("MachineLearning");
    setDescription("Machine Learning App");

    addService("MachineLearningService", new MachineLearningService());

    // Instance Manager
    addWorkflow(new InstanceWorkflow());
    addSpark(new InstanceBuilderSpecification());

    // Optimizer
    addWorkflow(new OptimizerWorkflow());
    addSpark(new OptimizerSpecification());

    // Instance object store
    try {
      ObjectStores.createObjectStore(getConfigurer(), "Instances", Instance.class);
    } catch (UnsupportedTypeException e) {
      throw new RuntimeException("Will never happen: all classes above are supported", e);
    }
  }

  public static class InstanceWorkflow extends AbstractWorkflow {

    protected String name;
    protected String hyperparameters;

    @Override
    public void initialize(WorkflowContext context) throws Exception {
      // Invoked before the Workflow run starts
      super.initialize(context);
      Map<String, String> args = context.getRuntimeArguments();

      WorkflowToken token = context.getToken();

      if (args.containsKey("name")) {
        this.name = args.get("name");
        token.put("name", Value.of(name));
      } else {
        LOG.debug("No name provided");
      }

      if (args.containsKey("hyperparameters")) {
        this.hyperparameters = args.get("hyperparameters");
        token.put("hyperparameters", Value.of(hyperparameters));
      } else {
        LOG.debug("No name provided");
      }

      if (args.containsKey("dataset")) {
        this.hyperparameters = args.get("dataset");
        token.put("dataset", Value.of(hyperparameters));
      } else {
        LOG.debug("No name provided");
      }
    }

    @Override
    public void configure() {
      addSpark("InstanceBuilder");
    }

  }

  public class MachineLearningService extends AbstractHttpServiceHandler {

    @UseDataSet("Instances")
    private ObjectStore<Instance> instances;

    @Path("instance/{name}/{run}")
    @GET
    public void getRun(HttpServiceRequest request, HttpServiceResponder responder,
                       @PathParam("name") String name, @PathParam("run") Integer run) {
      Instance instance = instances.read(name);

      Double rss = instance.getRunRsquared(run);
      if (rss != null) {
        responder.sendJson(instance.getRunRsquared(run));
      } else {
        responder.sendError(HttpURLConnection.HTTP_NOT_FOUND, "Not found");
      }
    }

    @Path("hyperparameters/{name}/")
    @GET
    public void getHyperparameters(HttpServiceRequest request, HttpServiceResponder responder,
                                   @PathParam("name") String name) {
      Instance instance = instances.read(name);

      String nextHyperparameters = instance.getNextHyperparameters();
      if (nextHyperparameters != null) {
        responder.sendJson(nextHyperparameters);
      } else {
        responder.sendError(HttpURLConnection.HTTP_NOT_FOUND, "Not found");
      }
    }

    @Path("numruns/{name}/")
    @GET
    public void getNumRuns(HttpServiceRequest request, HttpServiceResponder responder,
                                   @PathParam("name") String name) {
      Instance instance = instances.read(name);

      Integer numRuns = instance.getNumRuns();
      if (numRuns != null) {
        responder.sendJson(numRuns);
      } else {
        responder.sendError(HttpURLConnection.HTTP_NOT_FOUND, "Not found");
      }
    }

  }

  public static class OptimizerWorkflow extends AbstractWorkflow {

    @Override
    public void initialize(WorkflowContext context) throws Exception {
      // Invoked before the Workflow run starts
      super.initialize(context);
      Map<String, String> args = context.getRuntimeArguments();

      WorkflowToken token = context.getToken();
      if (args.containsKey("name")) {
        token.put("name", Value.of(args.get("name")));
      } else {
        LOG.debug("No name provided");
      }

      super.initialize(context);
    }

    @Override
    public void configure() {
      addSpark("Optimizer");
    }

  }
}