import React from 'react'
import { Model } from './Model'
import plus from '../../img/plus_ico.svg'

export const ModelContainer = (props) => {
  return (
    <div className='model-container'>
      {Object.entries(props.panels).map(([key, value]) => 
        <Model key={key} panel={value} 
          handleChangeFor={props.handleChangeFor(key)}
          handleSubmit={props.handleSubmit(key)} 
          removeModel={props.removeModel} 
          featured = {props.featured == key} 
          updateFeatured={props.updateFeatured} />)}
  	</div>
  )
}