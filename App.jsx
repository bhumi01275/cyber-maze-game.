import { useCallback, useEffect, useMemo, useState } from 'react'
import { Play, RotateCcw, Trophy, Timer, KeyRound, Zap, Smartphone, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

const SIZE = 13
const makeMaze = (level) => {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(1))
  const carve = (x, y) => {
    grid[y][x] = 0
    const dirs = [[0,-2],[2,0],[0,2],[-2,0]].sort(() => Math.random() - .5)
    for (const [dx,dy] of dirs) {
      const nx=x+dx, ny=y+dy
      if (nx>0 && ny>0 && nx<SIZE-1 && ny<SIZE-1 && grid[ny][nx]===1) {
        grid[y+dy/2][x+dx/2]=0
        carve(nx,ny)
      }
    }
  }
  carve(1,1)
  grid[1][1]=0
  grid[SIZE-2][SIZE-2]=0
  // Ensure the exit is reachable by carving a simple final corridor.
  for (let x=1; x<SIZE-1; x++) grid[1][x]=0
  for (let y=1; y<SIZE-1; y++) grid[y][SIZE-2]=0
  // Extra walls make later levels a little more challenging without blocking the route.
  if (level > 1) {
    for (let i=0; i<level*3; i++) {
      const x=2+Math.floor(Math.random()*(SIZE-4)), y=2+Math.floor(Math.random()*(SIZE-4))
      if (!(x===1 && y===1)) grid[y][x]=1
    }
  }
  grid[1][1]=0
  grid[SIZE-2][SIZE-2]=0
  return grid
}

export default function App() {
  const [level,setLevel]=useState(1)
  const [maze,setMaze]=useState(()=>makeMaze(1))
  const [player,setPlayer]=useState({x:1,y:1})
  const [moves,setMoves]=useState(0)
  const [seconds,setSeconds]=useState(0)
  const [started,setStarted]=useState(false)
  const [won,setWon]=useState(false)
  const [best,setBest]=useState(()=>Number(localStorage.getItem('cyber-best')||0))
  const [sound,setSound]=useState(true)
  const [installPrompt,setInstallPrompt]=useState(null)
  const [installed,setInstalled]=useState(false)

  useEffect(()=>{
    const handler=(e)=>{e.preventDefault();setInstallPrompt(e)}
    const installedHandler=()=>{setInstalled(true);setInstallPrompt(null)}
    window.addEventListener('beforeinstallprompt',handler)
    window.addEventListener('appinstalled',installedHandler)
    return ()=>{window.removeEventListener('beforeinstallprompt',handler);window.removeEventListener('appinstalled',installedHandler)}
  },[])

  useEffect(()=>{
    if(!started || won) return
    const id=setInterval(()=>setSeconds(s=>s+1),1000)
    return ()=>clearInterval(id)
  },[started,won])

  const reset=useCallback((nextLevel=level)=>{
    setLevel(nextLevel);setMaze(makeMaze(nextLevel));setPlayer({x:1,y:1})
    setMoves(0);setSeconds(0);setStarted(false);setWon(false)
  },[level])

  const move=useCallback((dx,dy)=>{
    if(won) return
    const nx=player.x+dx, ny=player.y+dy
    if(nx<0||ny<0||nx>=SIZE||ny>=SIZE||maze[ny][nx]===1) return
    setStarted(true);setPlayer({x:nx,y:ny});setMoves(m=>m+1)
    if(nx===SIZE-2 && ny===SIZE-2){
      setWon(true)
      const score=Math.max(1000-(seconds*8)-(moves*3),100)
      if(score>best){setBest(score);localStorage.setItem('cyber-best',String(score))}
    }
  },[player,won,maze,seconds,moves,best])

  useEffect(()=>{
    const onKey=(e)=>{
      const keys={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}
      const dir=keys[e.key]
      if(dir){e.preventDefault();move(...dir)}
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[move])

  const time=useMemo(()=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`,[seconds])
  const install=async()=>{if(!installPrompt)return;await installPrompt.prompt();setInstallPrompt(null)}

  return <main className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">⌘</span><span>NEON<span className="brand-light">LAB</span></span></a>
      <div className="top-actions">
        <span className="status"><i/> SYSTEM ONLINE</span>
        <button className="icon-button" onClick={()=>setSound(!sound)} aria-label="Toggle sound">{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>
        {installPrompt && <button className="install-btn" onClick={install}><Smartphone size={15}/> Install app</button>}
        {installed && <span className="installed-label">APP INSTALLED</span>}
      </div>
    </header>

    <section className="hero">
      <div className="eyebrow"><span/> THE GRID IS WAITING</div>
      <h1>CYBER MAZE<br/><span>ESCAPE</span><b className="title-dot">.</b></h1>
      <p className="subtitle">Navigate the neon labyrinth. Find the exit. Beat the system.</p>
      <div className="hero-line"><span>MISSION 0{level}</span><span className="line"/><span>SECTOR {String(level).padStart(2,'0')}</span></div>
    </section>

    <section className="game-layout">
      <div className="game-panel">
        <div className="panel-head">
          <div><span className="tiny-label">LIVE SIMULATION</span><h2>Maze interface</h2></div>
          <span className="level-tag">LVL {String(level).padStart(2,'0')}</span>
        </div>
        <div className="maze-wrap">
          <div className="maze-grid" style={{'--size':SIZE}}>
            {maze.flatMap((row,y)=>row.map((cell,x)=>{
              const isPlayer=player.x===x&&player.y===y
              const isExit=x===SIZE-2&&y===SIZE-2
              return <div key={`${x}-${y}`} className={`tile ${cell?'wall':'path'} ${isPlayer?'player':''} ${isExit?'exit':''}`}>
                {isPlayer?<span className="player-core"/>:isExit?<span className="exit-core"/>:null}
              </div>
            }))}
          </div>
          {!started&&!won&&<div className="start-hint"><span>▶</span> USE ARROW KEYS TO BEGIN</div>}
          {won&&<div className="win-overlay"><div className="win-card"><Trophy size={30}/><h3>SECTOR CLEARED</h3><p>You escaped the maze.</p><button className="primary-btn" onClick={()=>reset(level+1)}>NEXT LEVEL <ArrowRight size={16}/></button></div></div>}
        </div>
        <div className="game-footer"><span><i className="legend-player"/> YOU</span><span><i className="legend-exit"/> EXIT</span><span><i className="legend-wall"/> WALL</span><span className="footer-tip">WASD / ARROW KEYS</span></div>
      </div>

      <aside className="side-column">
        <div className="stats-card">
          <span className="tiny-label">MISSION DATA</span>
          <div className="stat-row"><div className="stat-icon"><Timer size={18}/></div><div><small>TIME ELAPSED</small><strong>{time}</strong></div></div>
          <div className="stat-row"><div className="stat-icon pink"><Zap size={18}/></div><div><small>MOVES MADE</small><strong>{String(moves).padStart(3,'0')}</strong></div></div>
          <div className="stat-row"><div className="stat-icon gold"><Trophy size={18}/></div><div><small>PERSONAL BEST</small><strong>{best?best.toLocaleString():'—'}</strong></div></div>
        </div>
        <div className="controls-card">
          <span className="tiny-label">CONTROL DECK</span>
          <p>Move through the maze</p>
          <div className="dpad">
            <button className="up" onClick={()=>move(0,-1)} aria-label="Move up"><ArrowUp/></button>
            <button className="left" onClick={()=>move(-1,0)} aria-label="Move left"><ArrowLeft/></button>
            <button className="down" onClick={()=>move(0,1)} aria-label="Move down"><ArrowDown/></button>
            <button className="right" onClick={()=>move(1,0)} aria-label="Move right"><ArrowRight/></button>
          </div>
          <button className="reset-btn" onClick={()=>reset()}><RotateCcw size={15}/> RESTART MISSION</button>
        </div>
        <div className="objective-card"><KeyRound size={18}/><div><b>YOUR OBJECTIVE</b><p>Reach the glowing exit tile. Avoid the walls and escape as fast as you can.</p></div></div>
      </aside>
    </section>

    <footer className="page-footer"><span>© 2026 NEONLAB INTERACTIVE</span><span>BUILT FOR THE BRAVE <b>◆</b></span></footer>
  </main>
}