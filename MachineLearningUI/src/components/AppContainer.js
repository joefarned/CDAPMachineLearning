import React from 'react'
import logo from '../img/cask_logo.png'
import plus from '../img/plus_ico.svg';
import { ModelFeature, ModelContainer } from './Models'

export const AppContainer = (props) => {
  return (
  	<div>
  		<div className='nav-bar'>
	  		<img src={logo} className='logo' />
	  		<input type='image' 
	  			src={plus} 
	  			className='plus' 
	  			onClick={props.addNewPanel} />
  		</div>

  		<ModelFeature key={props.panels[props.featured]} 
  			panel={props.panels[props.featured]} 
			handleChangeFor={props.handleChangeFor(props.featured)}
			handleSubmit={props.handleSubmit(props.featured)} />

 		<ModelContainer panels={props.panels} 
          handleChangeFor={props.handleChangeFor} 
          addNewPanel={props.addNewPanel} 
          handleSubmit={props.handleSubmit} 
          removeModel={props.removeModel} 
          featured={props.featured}
          updateFeatured={props.updateFeatured} />
  	</div>
  )
}