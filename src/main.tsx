import React from 'react'
import ReactDOM from 'react-dom/client'
import BiliCleaner from './App'
import './index.css'

ReactDOM.createRoot(
    (() => {
        const app = document.createElement('div', {})
        app.id = 'bilicleaner-root'
        console.log('[BC] bilicleaner loading')
        document.body.append(app)
        return app
    })(),
).render(
    <React.StrictMode>
        <BiliCleaner/>
    </React.StrictMode>,
)
