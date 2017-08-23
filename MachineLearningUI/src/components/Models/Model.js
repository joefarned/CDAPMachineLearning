import React from 'react'
import trash from '../../img/trash.jpeg'

export const Model = (props) => {
  return (
    <div className={props.featured ? 'model-featured' : 'model'} 
    	onClick={props.updateFeatured(props.panel.name)} >

    	<div className='model-header'>
    		{props.panel.name}
    	</div>

    	<div className='model-status'>
    		Linear Regression
		</div>

    	<div className='model-delete'>
			<input type='image' 
				src={trash} 
				className='model-delete-icon' 
				onClick={props.removeModel(props.panel.name)} />
		</div>
    </div>
  )
}