// Global variable to hold the currently dragged element
let draggedItem = null

document.addEventListener("DOMContentLoaded", () => {
  // Get references to the main elements
  const messageBox = document.getElementById("message-box")
  const sundayColumnsGridContainer = document.getElementById("sunday-columns-grid-container") // Container where Sunday columns will be injected
  const backToTopBtn = document.getElementById("back-to-top")

  // Initialize current month and year to today's date
  const today = new Date()
  const currentMonth = today.getMonth() // 0-indexed (0 = January, 11 = December)
  const currentYear = today.getFullYear()

  // Define the list of collaborators that will appear in each Sunday's section
  const collaboratorsList = [
    "Jessica",
    "Cindy",
    "Valentina",
    "Silvia",
  ]

  // Back to top button functionality
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    if (scrollTop > 300) {
      backToTopBtn.classList.add("show")
    } else {
      backToTopBtn.classList.remove("show")
    }
  }

  // Add scroll event listener
  window.addEventListener("scroll", handleScroll)

  /**
   * Formats a Date object into a readable date string in "día de mes de año" format.
   * @param {Date} dateObj - The Date object to format.
   * @returns {string} Formatted date string (e.g., "13 de julio de 2025").
   */
  function formatDate(dateObj) {
    const day = dateObj.getDate()
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]
    const month = months[dateObj.getMonth()]
    const year = dateObj.getFullYear()
    return `${day} de ${month} de ${year}`
  }

  /**
   * Updates the header text of a column with the selected date and time.
   * @param {HTMLElement} columnElement - The column's DOM element.
   * @param {string} baseTitle - The base title for the column (e.g., "Reunión Domingo").
   * @param {Date} dateObj - The Date object to format and display.
   * @param {string} timeStr - The time string (e.g., "14:30").
   */
  function updateColumnHeader(columnElement, baseTitle, dateObj, timeStr) {
    if (!dateObj) return // Exit if no valid date object
    const formattedDate = formatDate(dateObj)
    const timeDisplay = timeStr ? ` ${timeStr}h` : "" // Add 'h' for hours

    // Find the h2 and the date/time input container within the column element
    const h2Element = columnElement.querySelector("h2")
    const dateTimeInputsContainer = columnElement.querySelector(".date-time-inputs")

    // Update the inner HTML of the h2 element, preserving the input fields
    if (h2Element) {
      h2Element.innerHTML = `${baseTitle}, ${formattedDate}${timeDisplay}`
      if (dateTimeInputsContainer) {
        h2Element.appendChild(dateTimeInputsContainer) // Re-append the input container to keep it in place
      }
    }
  }

  /**
   * Displays a temporary message to the user with enhanced styling.
   * @param {string} message - The message text to display.
   * @param {string} type - The type of message ('info' or 'error') for styling.
   */
  function showTemporaryMessage(message, type = "info") {
    messageBox.textContent = message
    messageBox.className = `notification-toast show ${type}` // Add 'show' class to trigger transition
    messageBox.style.display = "block"
    setTimeout(() => {
      messageBox.classList.remove("show") // Hide after 4 seconds by removing 'show'
      setTimeout(() => {
        messageBox.style.display = "none"
      }, 300) // Wait for transition to complete
    }, 4000) // Increased duration for better UX
  }

  // Track assigned collaborators for observations
  const assignedCollaborators = new Set()

  /**
   * Updates the observations section when collaborators are added or removed
   */
  function updateObservationsSection() {
    const observationsSection = document.getElementById("observations-section")
    const observationsContainer = document.getElementById("observations-container")

    if (assignedCollaborators.size === 0) {
      observationsSection.classList.remove("show")
      return
    }

    observationsSection.classList.add("show")
    observationsContainer.innerHTML = ""

    assignedCollaborators.forEach((name) => {
      const observationItem = document.createElement("div")
      observationItem.className = "observation-item"
      observationItem.innerHTML = `
                <div class="observation-name">${name}</div>
                <textarea class="observation-textarea" placeholder="Agregar observación para ${name}..." data-name="${name}" rows="4"></textarea>
            `
      observationsContainer.appendChild(observationItem)
    })
  }

  /**
   * Gets all assigned collaborators from drop zones
   */
  function updateAssignedCollaborators() {
    assignedCollaborators.clear()

    // Get collaborators from all drop zones
    const allDropZones = document.querySelectorAll(".drop-zone")
    allDropZones.forEach((zone) => {
      const items = zone.querySelectorAll(".draggable-item")
      items.forEach((item) => {
        assignedCollaborators.add(item.dataset.name)
      })
    })

    updateObservationsSection()
  }

  // Enhanced touch support for drag and drop
  let touchStartY = 0
  let touchStartX = 0
  let isDragging = false

  /**
   * Attaches drag and drop event listeners to a given draggable item.
   * @param {HTMLElement} item - The draggable item DOM element.
   */
  function attachDragEventListeners(item) {
    // Mouse/desktop drag events
    item.addEventListener("dragstart", (e) => {
      draggedItem = e.target // Store the element being dragged
      console.log("Drag started:", e.target.dataset.name)
      e.dataTransfer.setData("text/plain", e.target.dataset.name)
      e.dataTransfer.effectAllowed = "move" // Visual feedback for allowed drop effect
      e.target.classList.add("dragging") // Add class for styling while dragging
    })

    item.addEventListener("dragend", (e) => {
      e.target.classList.remove("dragging") // Remove dragging class when drag ends
      draggedItem = null // Reset the dragged item
      console.log("Drag ended.")
    })

    // Touch events for mobile drag and drop
    item.addEventListener(
      "touchstart",
      (e) => {
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
        isDragging = false

        // Add visual feedback after a short delay to distinguish from tap
        setTimeout(() => {
          if (!isDragging) {
            // Only add if not already marked as dragging by touchmove
            item.classList.add("dragging")
          }
        }, 150)
      },
      { passive: true },
    )

    item.addEventListener(
      "touchmove",
      (e) => {
        const touchY = e.touches[0].clientY
        const touchX = e.touches[0].clientX
        const deltaY = Math.abs(touchY - touchStartY)
        const deltaX = Math.abs(touchX - touchStartX)

        if (deltaY > 10 || deltaX > 10) {
          // Threshold to consider it a drag, not a tap
          isDragging = true
          draggedItem = item // Set draggedItem for touch events

          // Find element under touch point
          const elementBelow = document.elementFromPoint(touchX, touchY)
          const dropZone = elementBelow?.closest(".drop-zone")

          // Remove drag-over class from all drop zones
          document.querySelectorAll(".drop-zone").forEach((zone) => {
            zone.classList.remove("drag-over")
          })

          // Add drag-over class to current drop zone
          if (dropZone) {
            dropZone.classList.add("drag-over")
          }
        }
      },
      { passive: true },
    )

    item.addEventListener(
      "touchend",
      (e) => {
        if (isDragging && draggedItem) {
          const touchX = e.changedTouches[0].clientX
          const touchY = e.changedTouches[0].clientY
          const elementBelow = document.elementFromPoint(touchX, touchY)
          const dropZone = elementBelow?.closest(".drop-zone")

          if (dropZone) {
            // Simulate drop event
            handleDrop(dropZone, draggedItem)
          }
        }

        // Clean up
        item.classList.remove("dragging")
        document.querySelectorAll(".drop-zone").forEach((zone) => {
          zone.classList.remove("drag-over")
        })
        draggedItem = null
        isDragging = false
      },
      { passive: true },
    )
  }

  /**
   * Handles the drop logic for both mouse and touch events
   * @param {HTMLElement} zone - The target drop zone element.
   * @param {HTMLElement} droppedItem - The item being dropped.
   */
  function handleDrop(zone, droppedItem) {
    if (!droppedItem) return

    const droppedName = droppedItem.dataset.name
    const targetColumn = zone.closest(".column")
    const targetColumnId = targetColumn ? targetColumn.id : null
    const sourceDropZone = droppedItem.parentNode

    console.log("Drop occurred in:", targetColumnId, "Dropped item:", droppedName)

    // Check for duplicates only in drop zones (not the available collaborators grid)
    if (zone.classList.contains("drop-zone")) {
      const existingNamesInTarget = Array.from(zone.querySelectorAll(".draggable-item")).map(
        (item) => item.dataset.name,
      )

      // If the item is being dropped into the same drop zone it came from, allow it.
      // This prevents duplicate messages when re-ordering within the same zone.
      if (sourceDropZone === zone) {
        zone.appendChild(droppedItem) // Re-append to maintain order if desired
        updateAssignedCollaborators()
        return
      }

      if (existingNamesInTarget.includes(droppedName)) {
        showTemporaryMessage(`El colaborador "${droppedName}" ya está asignado a esta fecha.`, "error")
        console.log("Duplicate name detected, drop prevented.")
        return
      }
    }

    let itemToAppend = droppedItem
    // If dragging from an 'available-collaborators' grid, clone the item
    if (sourceDropZone && sourceDropZone.classList.contains("available-collaborators")) {
      itemToAppend = droppedItem.cloneNode(true)
      itemToAppend.classList.remove("dragging") // Remove dragging class from clone
      attachDragEventListeners(itemToAppend) // Attach listeners to the new clone
    } else if (sourceDropZone && sourceDropZone.classList.contains("drop-zone")) {
      // If dragging from one drop zone to another, simply move the original item
      sourceDropZone.removeChild(droppedItem)
      console.log("Original item removed from source:", sourceDropZone.closest(".column").id)
    }

    // Apply specific class for Sunday dropped items
    if (targetColumnId && targetColumnId.startsWith("sunday-column-")) {
      itemToAppend.classList.add("sunday-dropped-item")
      // Ensure any previous "non-sunday" styles are removed if an item moves from say Friday's dropzone to Sunday's
      // (though in current setup, there's no Friday dropzone to move *from* to Sunday's)
    } else {
      // If item moves out of a Sunday dropzone, remove the class
      itemToAppend.classList.remove("sunday-dropped-item")
    }

    zone.appendChild(itemToAppend)
    console.log("Item moved/cloned to:", targetColumnId)

    // Update observations section
    updateAssignedCollaborators()

    // Show success message
    showTemporaryMessage(`✅ ${droppedName} asignado correctamente`, "info")
  }

  /**
   * Attaches drop zone event listeners to a given drop zone element.
   * @param {HTMLElement} zone - The drop zone DOM element.
   */
  function attachDropZoneListeners(zone) {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault() // Prevent default to allow dropping
      e.dataTransfer.dropEffect = "move" // Visual feedback for allowed drop effect
      zone.classList.add("drag-over") // Add class for styling when item is dragged over
      // console.log('Drag over:', zone.id);
    })

    zone.addEventListener("dragleave", (e) => {
      zone.classList.remove("drag-over") // Remove class when item leaves the drop zone
      // console.log('Drag leave:', zone.id);
    })

    zone.addEventListener("drop", (e) => {
      e.preventDefault() // Prevent default browser drop behavior
      zone.classList.remove("drag-over") // Remove drag-over styling
      handleDrop(zone, draggedItem)
    })
  }

  /**
   * Renders all Sundays for the currentMonth and currentYear.
   */
  function renderSundaysForMonth() {
    sundayColumnsGridContainer.innerHTML = "" // Clear existing Sundays
    assignedCollaborators.clear() // Clear assigned collaborators on initial load
    updateObservationsSection() // Update observations section to reflect cleared state

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day)
      if (date.getDay() === 0) {
        // 0 represents Sunday
        const dateString = date.toISOString().slice(0, 10) // YYYY-MM-DD
        const sundayColumnId = `sunday-column-${dateString}`
        const dropZoneId = `sunday-drop-zone-${dateString}`

        // Generate HTML for collaborators for this specific Sunday
        const collaboratorsGridId = `sunday-available-collaborators-grid-${dateString}`
        const collaboratorsHtml = collaboratorsList
          .map(
            (name) => `
                    <div class="draggable-item" data-name="${name}" draggable="true">${name}</div>
                `,
          )
          .join("")

        const sundayColumnDiv = document.createElement("div")
        sundayColumnDiv.className = "column" // Apply existing column styles
        sundayColumnDiv.id = sundayColumnId // Assign unique ID
        sundayColumnDiv.style.backgroundColor = "#ede9fe" // Light purple for Sunday columns

        const sundayTitleDate = formatDate(date)

        sundayColumnDiv.innerHTML = `
                    <h2>🧸 Reunión Domingo, ${sundayTitleDate}
                        <div class="date-time-inputs">
                            <input type="date" id="sunday-date-${dateString}" value="${dateString}">
                            <input type="time" id="sunday-time-${dateString}" value="10:30">
                        </div>
                    </h2>
                    <div class="available-collaborators" id="${collaboratorsGridId}">
                        <h3>👥 Colaboradores Disponibles</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
                            ${collaboratorsHtml}
                        </div>
                    </div>
                    <div class="drop-zone" id="${dropZoneId}"></div>
                `
        sundayColumnsGridContainer.appendChild(sundayColumnDiv)

        // Attach drop zone listeners to the newly created drop zone
        const newDropZone = document.getElementById(dropZoneId)
        attachDropZoneListeners(newDropZone)

        // Attach drag listeners to the collaborators in THIS Sunday's grid
        const newCollaboratorsGrid = document.getElementById(collaboratorsGridId)
        if (newCollaboratorsGrid) {
          newCollaboratorsGrid.querySelectorAll(".draggable-item").forEach((item) => {
            attachDragEventListeners(item)
          })
        }

        // Add event listeners for the date/time inputs in the new Sunday column
        const sundayDateInput = document.getElementById(`sunday-date-${dateString}`)
        const sundayTimeInput = document.getElementById(`sunday-time-${dateString}`)

        sundayDateInput.addEventListener("change", (event) => {
          updateColumnHeader(sundayColumnDiv, "🎵 Reunión Domingo", event.target.valueAsDate, sundayTimeInput.value)
        })
        sundayTimeInput.addEventListener("change", (event) => {
          updateColumnHeader(sundayColumnDiv, "🎵 Reunión Domingo", sundayDateInput.valueAsDate, event.target.value)
        })
      }
    }
  }

  // Initial render of Sundays for the current month
  renderSundaysForMonth()

  // Initial update of assigned collaborators (will be empty on load unless dynamically added)
  updateAssignedCollaborators()
})

/**
 * Smooth scroll to top function
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

/**
 * Enhanced PDF generation with better styling and error handling
 */
async function printAllColumnsToPdf() {
  const button = document.querySelector(".generate-pdf-button")
  const buttonText = button.querySelector(".button-text")
  const sundayColumnsContainer = document.getElementById("sunday-columns-grid-container")
  const observationsSection = document.getElementById("observations-section")

  if (!sundayColumnsContainer) {
    console.error("Contenedores de columnas no encontrados para generar el PDF.")
    return
  }

  // Show loading state
  button.classList.add("loading")
  buttonText.textContent = "Generando PDF"

  // Hide elements for PDF generation
  const allSundayColumns = sundayColumnsContainer.querySelectorAll(".column")
  allSundayColumns.forEach((column) => {
    const dateTimeInput = column.querySelector(".date-time-inputs")
    const availableCollaborators = column.querySelector(".available-collaborators")
    if (dateTimeInput) dateTimeInput.style.display = "none"
    if (availableCollaborators) availableCollaborators.style.display = "none"
  })

  try {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF("p", "mm", "a4")
    const pdfWidth = doc.internal.pageSize.getWidth()
    const pdfHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const titleSpacing = 15
    const sectionSpacing = 10
    const availableWidth = pdfWidth - margin * 2

    let currentY = margin

    // Enhanced title
    doc.setFontSize(22)
    doc.setFont(undefined, "bold")
    //doc.text("🎵 Producción - Calendario de Domingos", pdfWidth / 2, currentY, { align: "center" })
    currentY += titleSpacing

    const today = new Date()

    // Add date generated
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Generado el: ${today.toLocaleDateString("es-ES")}`, pdfWidth / 2, currentY, { align: "center" })
    currentY += titleSpacing

    // Process each Sunday column
    for (const sundayColumn of allSundayColumns) {
      const tempCanvas = await window.html2canvas(sundayColumn, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const tempHeight = (tempCanvas.height * availableWidth) / tempCanvas.width

      if (currentY + tempHeight + titleSpacing > pdfHeight - margin) {
        doc.addPage()
        currentY = margin
        doc.setFontSize(20)
        doc.setFont(undefined, "bold")
       // doc.text("🎵 Producción - Calendario de Domingos (Continuación)", pdfWidth / 2, currentY, { align: "center" })
        currentY += titleSpacing
      }

      const canvasSunday = await window.html2canvas(sundayColumn, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const imgWidthSunday = availableWidth
      const imgHeightSunday = (canvasSunday.height * imgWidthSunday) / canvasSunday.width

      doc.setFontSize(14)
      doc.setFont(undefined, "bold")
      const columnTitle = sundayColumn.querySelector("h2")?.textContent.trim() || "Reunión Domingo"
      //doc.text(columnTitle, margin, currentY)
      currentY += sectionSpacing

      doc.addImage(canvasSunday.toDataURL("image/png"), "PNG", margin, currentY, imgWidthSunday, imgHeightSunday)
      currentY += imgHeightSunday + titleSpacing
    }

    // Add observations section
    if (observationsSection && observationsSection.classList.contains("show")) {
      doc.addPage()
      let obsY = margin
      doc.setFontSize(20)
      doc.setFont(undefined, "bold")
      doc.text("Observaciones", pdfWidth / 2, obsY, { align: "center" })
      obsY += titleSpacing

      const observationItems = observationsSection.querySelectorAll(".observation-item")

      for (const item of observationItems) {
        const textarea = item.querySelector(".observation-textarea")
        const tempDiv = document.createElement("div")
        tempDiv.className = "temp-observation-text"
        tempDiv.textContent = textarea.value || textarea.placeholder
        tempDiv.style.cssText = `
                    flex: 1; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem;
                    font-size: 1rem; background-color: white; line-height: 1.5; box-sizing: border-box;
                    font-family: 'Inter', sans-serif; word-wrap: break-word; white-space: pre-wrap;
                    width: 100%; min-height: 80px;
                    color: ${textarea.value ? "#1e293b" : "#9ca3af"}; 
                    font-style: ${textarea.value ? "normal" : "italic"};
                `
        textarea.style.display = "none"
        item.appendChild(tempDiv)

        const canvasItem = await window.html2canvas(item, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
        })
        const itemWidth = availableWidth
        const itemHeight = (canvasItem.height * itemWidth) / canvasItem.width

        if (obsY + itemHeight > pdfHeight - margin) {
          doc.addPage()
          obsY = margin
          doc.setFontSize(20)
          doc.setFont(undefined, "bold")
          doc.text("Observaciones", pdfWidth / 2, obsY, { align: "center" })
          obsY += titleSpacing
        }

        doc.addImage(canvasItem.toDataURL("image/png"), "PNG", margin, obsY, itemWidth, itemHeight)
        obsY += itemHeight + sectionSpacing

        item.removeChild(tempDiv)
        textarea.style.display = ""
      }
    }

    // Save PDF with enhanced filename
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    const filename = `kids_Domingos_${dateString}.pdf`
    doc.save(filename)

    // Show success message
    const messageBox = document.getElementById("message-box")
    messageBox.textContent = "✅ PDF generado exitosamente"
    messageBox.className = "notification-toast show info"
    messageBox.style.display = "block"
    setTimeout(() => {
      messageBox.classList.remove("show")
      setTimeout(() => {
        messageBox.style.display = "none"
      }, 300)
    }, 4000)
  } catch (error) {
    console.error("Error al generar el PDF:", error)
    // Show error message
    const messageBox = document.getElementById("message-box")
    messageBox.textContent = "❌ Error al generar el PDF. Inténtalo de nuevo."
    messageBox.className = "notification-toast show error"
    messageBox.style.display = "block"
    setTimeout(() => {
      messageBox.classList.remove("show")
      setTimeout(() => {
        messageBox.style.display = "none"
      }, 300)
    }, 4000)
  } finally {
    // Restore UI
    const allSundayColumns = document.getElementById("sunday-columns-grid-container").querySelectorAll(".column")
    allSundayColumns.forEach((column) => {
      const dateTimeInput = column.querySelector(".date-time-inputs")
      const availableCollaborators = column.querySelector(".available-collaborators")
      if (dateTimeInput) dateTimeInput.style.display = "flex"
      if (availableCollaborators) availableCollaborators.style.display = "block"
    })

    const button = document.querySelector(".generate-pdf-button")
    const buttonText = button.querySelector(".button-text")
    button.classList.remove("loading")
    buttonText.textContent = "Generar PDF"
  }
}
