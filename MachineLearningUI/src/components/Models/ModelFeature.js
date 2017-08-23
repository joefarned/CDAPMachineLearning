import React from 'react'
import { Chart } from 'react-d3-core'
import { LineChart } from 'react-d3-basic'

import modelJSON from '../../lib/models/models'
import run from '../../img/run.jpeg';

var width = 400,
    height = 200,
    margins = {left: 60, right: 40, top: 15, bottom: 50},
    chartSeries = [
      {
        field: 'rsquared',
        color: '#ff7f0e'
      }
    ],
    yLabel='R-Squared',
    xLabel='Run Number',
    x = function(d) {
      return d.index;
    }

export const ModelFeature = (props) => {
  return (
  	<div className='feature'>
	    <form onSubmit={props.handleSubmit}>

	    	<div className='feature-header'>
		    	<input className='feature-header-title'
		    		type='text'
		    		value={props.panel.name} 
		    		onChange={props.handleChangeFor('name')} />
    		</div>

    		<div className='feature-status'>
    			Status: <i>{props.panel.status}</i>
    		</div>

    		<div className='feature-form'>
				<div className='feature-form-element'>
					Model Type:
					<br/>
					<select className='feature-form-input'
						value={props.modelType} 
						onChange={props.handleChangeFor('modelType')}>
							{Object.entries(modelJSON)
								.map(([key, value]) => 
									<option key={key} value={key}>{value.name}</option>
							)}
					</select>
				</div>


				<br />

				<div className='feature-form-element'>
					Equation:
					<br />
					<input type='text' 
						className='feature-form-input'
						value={props.panel.equation} 
						onChange={props.handleChangeFor('equation')} />
				</div>

				<br />

				<div className='feature-form-element'>
					Times to run:
					<br />
					<input type='text' 
						className='feature-form-input'
						value={props.panel.numberRuns} 
						onChange={props.handleChangeFor('numberRuns')} />
				</div>

				<div className='feature-form-element'>
					Source:
					<br />
					<input type='text' 
						className='feature-form-input'
						value={props.panel.source} 
						onChange={props.handleChangeFor('source')} />
				</div>

				<br />

				{Object.entries(props.panel.hyperparameters)
					.map(([key, value]) => 
						<div key={key} className='feature-form-element'>
							{key}: 
							<br />
							<input type='text' 
								className='feature-form-input'
								value={value}
								onChange={props.handleChangeFor(key)} />
						</div>
				)}
			</div>

			<div className='feature-graph'>
		      <LineChart
		        showXGrid={false}
		        showYGrid={false}
		        showLegend={false}
		        margins={margins}
		        data={props.panel.runs}
		        width={width}
		        height={height}
		        chartSeries={chartSeries}
		        xTicks={[props.panel.runs.length - 1]}
		        x={x}
		        yLabel={yLabel}
		        xLabel={xLabel} />

				{props.panel.runs.map(function(run) {
				   return (
				   		<span className='feature-graph-run'>
				   			Run Number {run['index']} : R-Squared {run['rsquared']}
				   		</span> 
			   		)
				})}
			</div>

			<div className='feature-submit'>
				<input type='image' src={run} className='feature-submit-icon' />
			</div>
	    </form>
	</div>
  )
}