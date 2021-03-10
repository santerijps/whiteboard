document.addEventListener("DOMContentLoaded", () => {

  //
  // DECLARE GLOBALS
  //

  const
    // DOM elements
    NAMESPACE = "http://www.w3.org/2000/svg",
    WHITEBOARD = document.getElementById("whiteboard"),
    SVG = document.createElementNS(NAMESPACE, "svg"),

    // Grid globals
    SIDELENGTH = 20,
    GRIDHEIGHT = Math.floor(WHITEBOARD.clientHeight / SIDELENGTH) * SIDELENGTH,
    GRIDWIDTH = Math.floor(WHITEBOARD.clientWidth / SIDELENGTH) * SIDELENGTH,
    CORNERERRORMARGIN = Math.round(SIDELENGTH / 4)

  let
    // Line globals
    DRAWHISTORY = [],
    INDICATORS = [],
    NEWLINEX = null,
    NEWLINEY = null

  //
  // SET DIMENSIONS AND ADD SVG TO WHITEBOARD (DOM)
  //

  SVG.setAttribute("height", GRIDHEIGHT.toString())
  SVG.setAttribute("width", GRIDWIDTH.toString())

  SVG.onclick = event => OnSvgClick(event)
  SVG.oncontextmenu = event => OnSvgContextMenu(event)
  SVG.onmousedown = event => OnSvgMouseDown(event)
  SVG.onmousemove = event => OnSvgMouseMove(event)
  SVG.onmouseup = event => OnSvgMouseUp(event)

  WHITEBOARD.appendChild(SVG)

  // Get the svg position relative to the client
  const SVGPOS = SVG.getBoundingClientRect()

  //
  // DECLARE FUNCTIONS
  //

  const

    AreNull = (...a) => {
      for (const x of a) {
        if (x !== null) {
          return false
        }
      }
      return true
    },

    DrawCircle = (x, y, radius, stroke, strokeWidth, fill) => {
      const circle = document.createElementNS(NAMESPACE, "circle")
      circle.setAttribute("cx", x)
      circle.setAttribute("cy", y)
      circle.setAttribute("r", radius)
      circle.setAttribute("stroke", stroke)
      circle.setAttribute("stroke-width", strokeWidth)
      circle.setAttribute("fill", fill)
      SVG.appendChild(circle)
      return circle
    },

    DrawGrid = () => {
      const grid = []
      const style = "stroke: gray; stroke-width: 1;"
      for (let x = 0; x <= GRIDWIDTH; x += SIDELENGTH)
        grid.push(DrawLine(x, 0, x, GRIDHEIGHT, style))
      for (let y = 0; y <= GRIDHEIGHT; y += SIDELENGTH)
        grid.push(DrawLine(0, y, GRIDWIDTH, y, style))
      return grid
    },

    DrawLine = (x1, y1, x2, y2, style) => {
      const line = document.createElementNS(NAMESPACE, "line")
      line.setAttribute("x1", x1)
      line.setAttribute("y1", y1)
      line.setAttribute("x2", x2)
      line.setAttribute("y2", y2)
      line.setAttribute("style", style)
      SVG.appendChild(line)
      return line
    },

    DrawText = (x, y, color, text) => {
      const t = document.createElementNS(NAMESPACE, "text")
      t.setAttribute("x", x)
      t.setAttribute("y", y)
      t.setAttribute("fill", color)
      t.setAttribute("style", ElementStyle({
        "font-size": `${SIDELENGTH - 2}px`,
        "user-select": "none"
      }))
      t.innerHTML = text
      SVG.appendChild(t)
      return t
    },

    ElementStyle = (fields = {}) => {
      const items = []
      for (const key in fields) {
        items.push(`${key}: ${fields[key]};`)
      }
      return items.join(" ")
    },

    GetMouseAndGridPosition = event => {
      const mouseX = Math.floor(event.clientX - SVGPOS.left)
      const mouseY = Math.floor(event.clientY - SVGPOS.top)
      return [mouseX, mouseY, Math.round(mouseX / SIDELENGTH), Math.round(mouseY / SIDELENGTH)]
    },

    IsCloseToCorner = (mouseX, mouseY, gridX, gridY) => {
      const horizontallyClose = Math.max(gridX * SIDELENGTH, mouseX) % mouseX - CORNERERRORMARGIN <= 0
      const verticallyClose = Math.max(gridY * SIDELENGTH, mouseY) % mouseY - CORNERERRORMARGIN <= 0
      return horizontallyClose && verticallyClose
    },

    LineStyle = (color = "black", width = "1") => {
      return `stroke: ${color}; stroke-width: ${width};`
    },

    MakeEventLine = (x1, y1, x2, y2, style) => {
      const line = DrawLine(x1, y1, x2, y2, style)
      line.oncontextmenu = OnLineContextMenu
      line.onmouseenter = OnLineMouseEnter
      return line
    },

    MakeEventText = (x, y, color, text) => {
      const t = document.createElementNS(NAMESPACE, "text")
      t.setAttribute("x", x)
      t.setAttribute("y", y)
      t.setAttribute("fill", color)
      t.setAttribute("style", ElementStyle({
        "font-size": `${SIDELENGTH - 2}px`,
        "user-select": "none"
      }))
      t.innerHTML = text
      t.onclick = OnTextClick
      SVG.appendChild(t)
      return t
    },

    OnLineContextMenu = event => {
      event.preventDefault()
      if (AreNull(NEWLINEX, NEWLINEY)) {
        RemoveLineCompletely(event.target)
      }
    },

    OnLineMouseEnter = event => {
      if (event.which === 3 ) {
        if (event.target.tagName === "line" && AreNull(NEWLINEX, NEWLINEY)) {
          RemoveLineCompletely(event.target)
        }
      }
    },

    OnSvgClick = event => {

      const [mouseX, mouseY, gridX, gridY] = GetMouseAndGridPosition(event)
      const x = gridX * SIDELENGTH, y = gridY * SIDELENGTH

      if (event.ctrlKey) {
        MakeEventText(x, y - 5, "black", "Hello, World!")
        return
      }

      if (!IsCloseToCorner(mouseX, mouseY, gridX, gridY))
        return

      // Set the origin for the new line
      if (AreNull(NEWLINEX, NEWLINEY)) {
        NEWLINEX = x
        NEWLINEY = y

      } else { // Draw the new line
        DRAWHISTORY.push(MakeEventLine(NEWLINEX, NEWLINEY, x, y, LineStyle("black", "2")))
        NEWLINEX = null
        NEWLINEY = null
      }

    },

    OnSvgContextMenu = event => {
      event.preventDefault()
      if (!AreNull(NEWLINEX, NEWLINEY)) {
        NEWLINEX = null
        NEWLINEY = null
        while (INDICATORS.length > 0) {
          INDICATORS.shift().remove()
        }
      }
    },

    OnSvgMouseDown = event => {

    },

    OnSvgMouseMove = event => {

      const [mouseX, mouseY, gridX, gridY] = GetMouseAndGridPosition(event)

      if (IsCloseToCorner(mouseX, mouseY, gridX, gridY)) {

        SVG.style.cursor = "crosshair"

        // Draw a circle to indicate the closest corner
        if (AreNull(NEWLINEX, NEWLINEY)) {
          INDICATORS.push(DrawCircle(gridX * SIDELENGTH, gridY * SIDELENGTH, "3", "gray", "2", "red"))
        }

        // Draw an imaginary line to indicate what the drawn line would look like.
        else {
          INDICATORS.push(DrawLine(NEWLINEX, NEWLINEY, gridX * SIDELENGTH, gridY * SIDELENGTH, LineStyle("green", "2")))
        }

        // Remove extra indicator
        if (INDICATORS.length > 1) {
          INDICATORS.shift().remove()
        }

      }

      // Clear out all imaginary indicators.
      else {
        SVG.style.cursor = "default"
        while (INDICATORS.length > 0) {
          INDICATORS.shift().remove()
        }
      }

    },

    OnSvgMouseUp = event => {
      // todo
    },

    OnTextClick = event => {
      console.log(event.target.innerHTML)
    },

    RemoveLineCompletely = drawing => {
      const index = DRAWHISTORY.findIndex(d => d === drawing)
      DRAWHISTORY.splice(index, 1)
      drawing.remove()
    }

  //
  // DRAW THE GRID
  //

  const GRID = DrawGrid()
  console.log(WHITEBOARD.clientWidth, WHITEBOARD.clientHeight, SIDELENGTH)

})