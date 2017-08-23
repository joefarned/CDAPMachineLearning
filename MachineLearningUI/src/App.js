import React, { Component } from 'react';
import './stylesheets/styles.css';
import { AppContainer } from './components/AppContainer'
import modelJSON from './lib/models/models'
import { runModel } from './lib/helpers'

class App extends Component {

  /* 
    State consists of models, which are implentations of an algorithm,
    and the featured model, which is displayed in the left panel.
    Models are indexed by their name, so the name must be unique.
  */
  state = {
    models: [],
    featured: ''
  }

  /*
    Sets the inital state before the App mounts
  */ 
  componentWillMount() {
    const initialModel = {
      'SampleModel': {
        name: 'SampleModel',
        modelType: 'linear-regression-analytics',
        hyperparameters: modelJSON['linear-regression-analytics'].hyperparameters,
        source: 'LinearRegressionData',
        equation: 'y ~ x',
        numberRuns: '0',
        status: 'Stopped',
        runs: [
          {
            index: 0,
            rsquared: 0.7
          },
          {
            index: 1,
            rsquared: 0.98
          },
          {
            index: 2,
            rsquared: 0.3
          }
        ]
      }
    }

    this.setState({ 
      models: initialModel,
      featured: 'SampleModel'
    })
  }

  /*
    Handle the addition of a new model 
  */
  addNewModel = (event) => {
    // Prevents page from re-loading
    event.preventDefault()

    var key = 'SampleModel'

    // Append _1 until we have a unique name 
    // Risky maneuver! hook 'em
    while (key in this.state.models) {
      key += '_1'
    }

    const newModel = {
      name: key,
      modelType: 'linear-regression-analytics',
      hyperparameters: modelJSON['linear-regression-analytics'].hyperparameters,
      source: 'LinearRegressionSource',
      equation: 'y ~ x',
      numberRuns: '0',
      status: 'Stopped',
      runs: [
        {
          index: 0,
          rsquared: 0.7
        },
        {
          index: 1,
          rsquared: 0.2
        },
      ]
    }

    const updatedModels = {
      ...this.state.models,
      [key]: newModel
    }

    this.setState({ models: updatedModels });
  }

  /*
    This changes which model is highlighted in the featured panel 
    on the left of the screen
  */
  updateFeatured = (modelName) => (event) => {
    if (this.state.models[modelName]) {
      this.setState({ featured: modelName })
    }
  }

  /*
    Run the model
    TODO: update number of iterations
  */
  handleSubmit = (modelName) => (event) => {
    event.preventDefault()
    const model = this.state.models[modelName]
    runModel(model, 2)
  }

  /*
    Removes a model, unless there is only one model remaining
  */
  removeModel = (modelName) => (event) => {
    const models = this.state.models

    if (Object.keys(this.state.models).length <= 1) {
      return
    }

    if (this.state.featured == modelName) {
      delete models[modelName]
      this.setState({ 
        models: models,
        featured: Object.keys(models)[0]
      })
    } else if (this.state.models[modelName]) {
      delete models[modelName]
      this.setState({ models: models });
    }  
  }

  /*
    Handle an update from the feature panel
  */
  handleChangeFor = (modelName) => (fieldName) => (event) => {
    const model = this.state.models[modelName]
    const target = event.target;
    const value = target.value;

    if (model[fieldName] != null) {
      model[fieldName] = value
    } else if (model.hyperparameters[fieldName] != null) {
      model.hyperparameters[fieldName] = value
    } else {
      return
    }

    if (fieldName == 'modelType') {
      model.hyperparameters = modelJSON[value].hyperparameters
    } else if (fieldName == 'name') {
      delete this.state.models[modelName]

      if (this.state.featured == modelName) {
        this.state.featured = value
      }

      modelName = value
    }

    const updatedModels = {
      ...this.state.models,
      [modelName]: model
    }

    this.setState({ models: updatedModels });
  }

  render() {
    return (    
      <div>  
        <AppContainer 
          featured={this.state.featured}
          panels={this.state.models} 
          handleChangeFor={this.handleChangeFor} 
          addNewPanel={this.addNewModel} 
          handleSubmit={this.handleSubmit} 
          removeModel={this.removeModel} 
          updateFeatured={this.updateFeatured} />
      </div>
    );
  }
}

export default App;
