import { stopDevProcesses } from './lib/dev-runtime.mjs'

stopDevProcesses(process.cwd())
console.log('Petory dev stopped (electron-vite, Electron, port 5173, singleton locks).')
