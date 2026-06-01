import * as React from 'react'
import { renderToString } from 'react-dom/server'
import Page from './src/app/(dashboard)/patients/new/page'

console.log("Starting render test...")
try {
    const html = renderToString(React.createElement(Page))
    console.log("Render successful length:", html.length)
} catch (e) {
    console.error("Render failed!")
    console.error(e)
}
