import trainer from './pipelines/trainer.json'
import evaluator from './pipelines/evaluator.json'

const proxyUrl = 'http://localhost:8111/rest/v3'
const namespace = '/default'
const baseUrl = proxyUrl + '/namespaces' + namespace

const updateTrainerJSON = (panel) => {
	return fetch(baseUrl + '/data/datasets/' + panel.source + '/properties', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	console.log(panel.source)

    	if (data == null) {
    		console.log('No such dataset ' + panel.source)
    	}

		var temp = JSON.stringify(trainer).replace(/SOURCE/g, panel.source)
		var schema = JSON.stringify(JSON.parse(data)['schema'])
		temp = temp.replace(/SCHEMA/g, schema.substring(1, schema.length - 1))
		temp = temp.replace(/TRAINER/g, 'LinearRegressionTrainer') // TODO
		temp = temp.replace(/MODELTYPE/g, panel.modelType)
		temp = temp.replace(/INCLUDE/g, 'x') // TODO
		temp = temp.replace(/RESPONSE/g, 'y') // TODO
		temp = temp.replace(/MODELFILESET/g, panel.name + 'Model')

		return JSON.parse(temp)
    })

}

const updateEvaluatorJSON = (panel) => {
	return fetch(baseUrl + '/data/datasets/' + panel.source + '/properties', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
		var temp = JSON.stringify(evaluator).replace(/SOURCE/g, panel.source)
		var schema = JSON.stringify(JSON.parse(data)['schema'])

		temp = temp.replace(/INPUT_SCHEMA/g, schema.substring(1, schema.length - 1))
		temp = temp.replace(/CLASSIFIER/g, 'LinearRegressionClassifier') // TODO
		temp = temp.replace(/MODELTYPE/g, panel.modelType)
		temp = temp.replace(/INCLUDE/g, 'x') // TODO
		temp = temp.replace(/MODELFILESET/g, panel.name + 'Model')
		temp = temp.replace(/ROWFIELD/g, 'x') // TODO
		temp = temp.replace(/SINK/g, panel.name + 'Classification') // TODO

		var out_schema = JSON.parse(JSON.parse(data)['schema'])
		out_schema['fields'].push({"name":"y_hat", "type":"double"})
		var out_schema_string = JSON.stringify(out_schema)
		out_schema_string = JSON.stringify(out_schema_string)
		temp = temp.replace(/CLASSIFICATION_SCHEMA/g, out_schema_string.substring(1, out_schema_string.length - 1)) // TODO

		return JSON.parse(temp)
    })
}

// DELETE /v3/namespaces/<namespace-id>/apps/<pipeline-name>
export const deleteEvaluatorPipeline = (panel) => {
	return fetch(baseUrl + '/apps/', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	// Delete pipeline if it already exists
        const artifactsArray = JSON.parse(data)
        artifactsArray.forEach(function (obj) {
        	if (obj.name === panel.name + 'Evaluator') {
        		return fetch(baseUrl + '/apps/' + panel.name + 'Evaluator', {
					method: 'DELETE',
				})
        	}
        })    
    })
}

export const deleteTrainerPipeline = (panel) => {
	return fetch(baseUrl + '/apps/', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	// Delete pipeline if it already exists
        const artifactsArray = JSON.parse(data)
        artifactsArray.forEach(function (obj) {
        	if (obj.name === panel.name + 'Trainer') {
        		return fetch(baseUrl + '/apps/' + panel.name + 'Trainer', {
					method: 'DELETE',
				})
        	}
        })    
    })
}

export const deleteModel = (panel) => {
	return fetch(baseUrl + '/data/datasets', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	// Delete pipeline if it already exists
        const artifactsArray = JSON.parse(data)
        artifactsArray.forEach(function (obj) {
        	if (obj.name === panel.name + 'Model') {
        		return fetch(baseUrl + '/data/datasets/' + panel.name + 'Model', {
					method: 'DELETE',
				})
        	}
        })    
    })
}

export const deleteEvaluatorDataset = (panel) => {
	return fetch(baseUrl + '/data/datasets', {
		method: 'GET'
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	// Delete pipeline if it already exists
        const artifactsArray = JSON.parse(data)
        artifactsArray.forEach(function (obj) {
        	if (obj.name === 'ClassificationSinkTest') {
        		return fetch(baseUrl + '/data/datasets/ClassificationSinkTest', {
					method: 'DELETE',
				})
        	}
        })    
    })
}

//	PUT /v3/namespaces/<namespace-id>/apps/<pipeline-name>
export const createTrainerPipeline = (panel) => {
	return updateTrainerJSON(panel).then(function(data) {
		return fetch(baseUrl + '/apps/' + panel.name + 'Trainer', {
	    headers: {
	        'Content-Type': 'application/json',
	    },
		method: 'PUT',
		body: JSON.stringify(data)
		}) 
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    })
}

//	PUT /v3/namespaces/<namespace-id>/apps/<pipeline-name>
export const createEvaluatorPipeline = (panel) => {
	return updateEvaluatorJSON(panel).then(function(data) {
		return fetch(baseUrl + '/apps/' + panel.name + 'Evaluator', {
	    headers: {
	        'Content-Type': 'application/json',
	    },
		method: 'PUT',
		body: JSON.stringify(data)
		})
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    })
}

// 	POST /v3/namespaces/<namespace-id>/apps/<pipeline-name>/workflows/DataPipelineWorkflow/start -d '{ <hyperparameters> }'
const trainModel = (panel) => {
	return fetch(baseUrl + '/apps/' + panel.name + 'Trainer' + '/workflows/DataPipelineWorkflow/start', {
	    headers: {
	        'Content-Type': 'application/json',
	    },
		method: 'POST',
		body: JSON.stringify(panel.hyperparameters)
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(response) {
    	return waitPipeline(panel.name + 'Trainer')
    })
}

// 	POST /v3/namespaces/<namespace-id>/apps/<pipeline-name>/workflows/DataPipelineWorkflow/start
const evaluateModel = (panel) => {
	return fetch(baseUrl + '/apps/' + panel.name + 'Evaluator' + '/workflows/DataPipelineWorkflow/start', {
		method: 'POST',
	}).then(function(res) {
		return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(response) {
    	return waitPipeline(panel.name + 'Evaluator')
    })
}


const waitWorkflow = (name) => {
	return fetch(baseUrl + '/apps/MachineLearning/workflows/' + name + '/status', {
		method: 'GET',
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	const statusObject = JSON.parse(data)
    	// Repeat
    	if (statusObject['status'] === 'RUNNING') {
    		return waitWorkflow(name) // Less busy way to do this?
    	}
    })
}


const waitPipeline= (name) => {
	return fetch(baseUrl + '/apps/' + name + '/workflows/DataPipelineWorkflow/status', {
		method: 'GET',
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(data) {
    	const statusObject = JSON.parse(data)
    	// Repeat
    	if (statusObject['status'] === 'RUNNING') {
    		return waitPipeline(name) // Less busy way to do this?
    	}
    })
}

//	POST v3/namespaces/<namespace-id>/apps/MachineLearning/workflows/InstanceWorkflow/start -d '{ "name":<name>, "hyperparameters": <hyperparameters> }'
const recordModelRun = (panel) => {
	var params = ""

	for (var key in panel.hyperparameters) {
    	params += panel.hyperparameters[key] + ","
	}
	params = params.substring(0, params.length - 1); // hack, think of something better

	var requestBody = {
		'hyperparameters': params,
		'name': panel.name,
		'dataset': panel.name + 'Classification'
	}

	console.log(JSON.stringify(requestBody))

	return fetch(baseUrl + '/apps/MachineLearning/workflows/InstanceWorkflow/start', {
	    headers: {
	        'Content-Type': 'application/json',
	    },
		method: 'POST',
		body: JSON.stringify(requestBody)
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(response) {
    	return waitWorkflow('InstanceWorkflow')
    })
}


// 	POST v3/namespaces/<namespace-id>/apps/MachineLearning/workflows/InstanceWorkflow/start -d '{ "name": <name> }'
const getNextHyperparameters = (panel) => {
	var requestBody = {
		'name': panel.name,
	}

    return fetch(baseUrl + '/apps/MachineLearning/workflows/OptimizerWorkflow/start', {
	    headers: {
	        'Content-Type': 'application/json',
	    },
		method: 'POST',
		body: JSON.stringify(requestBody)
	}).then(function(res) {
        return res.json()
    }).catch(function(error) {
        console.log(error)
    }).then(function(response) {
    	return waitWorkflow('OptimizerWorkflow')
    })
}

export const runModel = (panel, numRuns) => {
	if (numRuns > 0) {
		numRuns = numRuns - 1
		deleteEvaluatorPipeline(panel)
		.then(function(response) {
			return deleteTrainerPipeline(panel)
		}).then(function(response) {
			return deleteModel(panel)
		}).then(function(response) {
			return deleteEvaluatorDataset(panel)
		}).then(function(response) {
			return createTrainerPipeline(panel)
		}).then(function(response) {
			return createEvaluatorPipeline(panel)
		}).then(function(response) {
			return trainModel(panel)
		}).then(function(response) {
			return evaluateModel(panel)
		}).then(function(response) {
			return recordModelRun(panel)
		}).then(function(response) {
			return getNextHyperparameters(panel)
		}).then(function(response) {
			return fetch(baseUrl + '/apps/MachineLearning/services/MachineLearningService/methods/hyperparameters/' + panel.name, {
			    headers: {
			        'Content-Type': 'application/json',
			    },
				method: 'GET',
			}).then(function(res) {
		        return res.json()
		    }).catch(function(error) {
		        console.log(error)
		    });
		}).then(function(response) {
			var params = response.split(',')

			panel.hyperparameters['numIterations'] = params[0].substring(1, params[0].length);
			panel.hyperparameters['stepSize'] = params[1].substring(0, params[1].length - 1);

			return console.log(panel.hyperparameters)
		}).then(function(response) {
			return runModel(panel, numRuns)
		})
	}
}


