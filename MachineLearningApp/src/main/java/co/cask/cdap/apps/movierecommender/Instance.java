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
 */

package co.cask.cdap.apps.movierecommender;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.ArrayList;

public class Instance implements Serializable {

    private static final Logger LOG = LoggerFactory.getLogger(Instance.class);

    private static final long serialVersionUID = -1258765752695193629L;

    private final String name;
    private int numRuns;
    private final ArrayList<Run> runs;
    private String nextHyperparameters = "not updated";

    public Instance(String name) {
        this.runs = new ArrayList<Run>(5);
        this.numRuns = 0;
        this.name = name;
    }

    private class Run {
        int runNumber;
        String hyperparameters;
        Double rss;
        Double rsquared;

        Run(int runNumber, String hyperparameters, Double rss, Double rsquared) {
            this.runNumber = runNumber;
            this.hyperparameters = hyperparameters;
            this.rss = rss;
            this.rsquared = rsquared;
        }

        public String getHyperparameters() {
            return this.hyperparameters;
        }

        public Double getRss() {
            return this.rss;
        }

        public Double getRsquared() {
            return rsquared;
        }
    }

    public void addRun(String hyperparameters, Double rss, Double rsquared) {
        this.numRuns += 1;
        Run run = new Run(this.numRuns, hyperparameters, rss, rsquared);
        runs.add(run);
    }

    public String getRunHyperparameters(int i) {
        return runs.get(i).getHyperparameters();
    }

    public String getOptimizerString() {
        String optimizerString = "";
        for (Run r : runs) {
            if (optimizerString != "") {
                optimizerString += ",";
            }

            optimizerString += r.getHyperparameters() + "," + r.getRsquared();
        }

        return optimizerString;
    }


    public Double getRunRsquared(int i) {
        return runs.get(i).getRsquared();
    }

    public int getNumRuns() {
        return this.numRuns;
    }

    public void setNextHyperparameters(String nextHyperparameters) {
        this.nextHyperparameters = nextHyperparameters;
    }

    public String getNextHyperparameters() {
        return this.nextHyperparameters;
    }

}