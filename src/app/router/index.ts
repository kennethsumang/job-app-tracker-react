/**
 * Router entry point: builds the browser router from the composed route tree.
 */
import { createBrowserRouter } from 'react-router'
import { routes } from './routes'

export const router = createBrowserRouter(routes)

export { routes }
