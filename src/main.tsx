import React from 'react'
import ReactDOM from 'react-dom/client'
import SkipSegment from './apps/SkipSegment/SkipSegment.tsx'
import {MorePlayRate} from "./apps/MorePlayRate.tsx"

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
        <SkipSegment/>
        <MorePlayRate/>
    </React.StrictMode>,
)
