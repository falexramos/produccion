
// Global variable to hold the currently dragged element
let draggedItem = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the main columns and drop zones
    const fridayColumn = document.getElementById('friday-column');
    const sundayColumn = document.getElementById('sunday-column');
    const dropZones = document.querySelectorAll('.drop-zone'); // Select all elements with class 'drop-zone'
    const fridayDateInput = document.getElementById('friday-date');
    const fridayTimeInput = document.getElementById('friday-time');
    const sundayDateInput = document.getElementById('sunday-date');
    const sundayTimeInput = document.getElementById('sunday-time');
    const messageBox = document.getElementById('message-box');

    /**
     * Formats a Date object into a readable date string in "día de mes de año" format.
     * @param {Date} dateObj - The Date object to format.
     * @returns {string} Formatted date string (e.g., "13 de julio de 2025").
     */
    function formatDate(dateObj) {
        const day = dateObj.getDate();
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day} de ${month} de ${year}`;
    }

    /**
     * Updates the header text of a column with the selected date and time.
     * @param {HTMLElement} columnElement - The column's DOM element (e.g., fridayColumn, sundayColumn).
     * @param {string} baseTitle - The base title for the column (e.g., "Mesas Viernes", "Reunión Domingo").
     * @param {Date} dateObj - The Date object to format and display.
     * @param {string} timeStr - The time string (e.g., "14:30").
     */
    function updateColumnHeader(columnElement, baseTitle, dateObj, timeStr) {
        if (!dateObj) return; // Exit if no valid date object
        const formattedDate = formatDate(dateObj);
        const timeDisplay = timeStr ? ` ${timeStr}h` : ''; // Add 'h' for hours

        // Find the h2 and the date/time input container within the column element
        const h2Element = columnElement.querySelector('h2');
        const dateTimeInputsContainer = columnElement.querySelector('.date-time-inputs');

        // Update the inner HTML of the h2 element, preserving the input fields
        h2Element.innerHTML = `${baseTitle}, ${formattedDate}${timeDisplay}`;
        h2Element.appendChild(dateTimeInputsContainer); // Re-append the input container to keep it in place
    }

    /**
     * Calculates the date of the next upcoming specific day of the week.
     * @param {number} dayOfWeek - The target day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
     * @returns {Date} The Date object for the next upcoming specified day.
     */
    function getNextDayOfWeek(dayOfWeek) {
        const today = new Date();
        const currentDay = today.getDay();
        let diff = dayOfWeek - currentDay;
        if (diff <= 0) { // If the target day has already passed this week or is today
            diff += 7; // Add 7 days to get to next week's target day
        }
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + diff);
        return nextDate;
    }

    // Set initial date and time for 'Viernes' column
    const nextFriday = getNextDayOfWeek(5); // 5 for Friday
    fridayDateInput.valueAsDate = nextFriday;
    fridayTimeInput.value = '18:00'; // Default time for Friday
    updateColumnHeader(fridayColumn, 'Mesas Viernes', nextFriday, fridayTimeInput.value);

    // Set initial date and time for 'Domingo' column
    const nextSunday = getNextDayOfWeek(0); // 0 for Sunday
    sundayDateInput.valueAsDate = nextSunday;
    sundayTimeInput.value = '11:00'; // Default time for Sunday (changed from 13:00)
    updateColumnHeader(sundayColumn, 'Reunión Domingo', nextSunday, sundayTimeInput.value); // Changed baseTitle

    // Add event listeners for when the date/time inputs change
    fridayDateInput.addEventListener('change', (event) => {
        updateColumnHeader(fridayColumn, 'Mesas Viernes', event.target.valueAsDate, fridayTimeInput.value);
    });
    fridayTimeInput.addEventListener('change', (event) => {
        updateColumnHeader(fridayColumn, 'Mesas Viernes', fridayDateInput.valueAsDate, event.target.value);
    });

    sundayDateInput.addEventListener('change', (event) => {
        updateColumnHeader(sundayColumn, 'Reunión Domingo', event.target.valueAsDate, sundayTimeInput.value); // Changed baseTitle
    });
    sundayTimeInput.addEventListener('change', (event) => {
        updateColumnHeader(sundayColumn, 'Reunión Domingo', sundayDateInput.valueAsDate, event.target.value); // Changed baseTitle
    });

    /**
     * Displays a temporary message to the user.
     * @param {string} message - The message text to display.
     * @param {string} type - The type of message ('info' or 'error') for styling.
     */
    function showTemporaryMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `show ${type}`; // Add 'show' class to trigger transition
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.classList.remove('show'); // Hide after 3 seconds by removing 'show'
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 300); // Wait for transition to complete
        }, 3000);
    }

    // Track assigned collaborators for observations
    let assignedCollaborators = new Set();

    /**
     * Updates the observations section when collaborators are added or removed
     */
    function updateObservationsSection() {
        const observationsSection = document.getElementById('observations-section');
        const observationsContainer = document.getElementById('observations-container');

        if (assignedCollaborators.size === 0) {
            observationsSection.classList.remove('show');
            return;
        }

        observationsSection.classList.add('show');
        observationsContainer.innerHTML = '';

        assignedCollaborators.forEach(name => {
            const observationItem = document.createElement('div');
            observationItem.className = 'observation-item';
            observationItem.innerHTML = `
    <div class="observation-name">${name}</div>
    <textarea class="observation-textarea" placeholder="Agregar observación para ${name}..." data-name="${name}" rows="3"></textarea>
`;
            observationsContainer.appendChild(observationItem);
        });
    }

    /**
     * Gets all assigned collaborators from drop zones
     */
    function updateAssignedCollaborators() {
        assignedCollaborators.clear();

        // Get collaborators from both drop zones
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            const items = zone.querySelectorAll('.draggable-item');
            items.forEach(item => {
                assignedCollaborators.add(item.dataset.name);
            });
        });

        updateObservationsSection();
    }

    // Enhanced touch support for drag and drop
    let touchStartY = 0;
    let touchStartX = 0;
    let isDragging = false;

    // Iterate over all draggable items to add dragstart and dragend listeners
    document.querySelectorAll('.draggable-item').forEach(item => {
        // Mouse/desktop drag events
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target; // Store the element being dragged
            console.log('Drag started:', e.target.dataset.name);
            e.dataTransfer.setData('text/plain', e.target.dataset.name);
            e.dataTransfer.effectAllowed = 'move'; // Visual feedback for allowed drop effect
            e.target.classList.add('dragging'); // Add class for styling while dragging
        });

        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging'); // Remove dragging class when drag ends
            draggedItem = null; // Reset the dragged item
            console.log('Drag ended.');
        });

        // Touch events for mobile drag and drop
        item.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isDragging = false;

            // Add visual feedback
            setTimeout(() => {
                if (!isDragging) {
                    item.classList.add('dragging');
                }
            }, 100);
        }, { passive: true });

        item.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const deltaY = Math.abs(touchY - touchStartY);
            const deltaX = Math.abs(touchX - touchStartX);

            if (deltaY > 10 || deltaX > 10) {
                isDragging = true;
                draggedItem = item;

                // Find element under touch point
                const elementBelow = document.elementFromPoint(touchX, touchY);
                const dropZone = elementBelow?.closest('.drop-zone');

                // Remove drag-over class from all drop zones
                document.querySelectorAll('.drop-zone').forEach(zone => {
                    zone.classList.remove('drag-over');
                });

                // Add drag-over class to current drop zone
                if (dropZone) {
                    dropZone.classList.add('drag-over');
                }
            }
        }, { passive: true });

        item.addEventListener('touchend', (e) => {
            if (isDragging && draggedItem) {
                const touchX = e.changedTouches[0].clientX;
                const touchY = e.changedTouches[0].clientY;
                const elementBelow = document.elementFromPoint(touchX, touchY);
                const dropZone = elementBelow?.closest('.drop-zone');

                if (dropZone) {
                    // Simulate drop event
                    handleDrop(dropZone, draggedItem);
                }
            }

            // Clean up
            item.classList.remove('dragging');
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('drag-over');
            });
            draggedItem = null;
            isDragging = false;
        }, { passive: true });
    });

    /**
     * Handles the drop logic for both mouse and touch events
     */
    function handleDrop(zone, droppedItem) {
        if (!droppedItem) return;

        const droppedName = droppedItem.dataset.name;
        const targetColumnId = zone.closest('.column').id;
        const sourceDropZone = droppedItem.parentNode;

        console.log('Drop occurred in:', targetColumnId, 'Dropped item:', droppedName);

        // Check for duplicates only in 'Viernes' and 'Domingo' columns
        if (targetColumnId === 'friday-column' || targetColumnId === 'sunday-column') {
            const existingNamesInTarget = Array.from(zone.querySelectorAll('.draggable-item')).map(item => item.dataset.name);

            if (existingNamesInTarget.includes(droppedName)) {
                showTemporaryMessage(`El nombre "${droppedName}" ya está en esta mesa.`, 'error');
                console.log('Duplicate name detected, drop prevented.');
                return;
            }
        }

        // Logic for moving or cloning items
        if (sourceDropZone) {
            sourceDropZone.removeChild(droppedItem);
            console.log('Original item removed from source:', sourceDropZone.closest('.column').id);
        }
        zone.appendChild(droppedItem);
        console.log('Original item moved to:', targetColumnId);

        // Update observations section
        updateAssignedCollaborators();
    }

    // Iterate over all drop zones to add dragover, dragleave, and drop listeners
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Prevent default to allow dropping
            e.dataTransfer.dropEffect = 'move'; // Visual feedback for allowed drop effect
            zone.classList.add('drag-over'); // Add class for styling when item is dragged over
            console.log('Drag over:', zone.closest('.column').id);
        });

        zone.addEventListener('dragleave', (e) => {
            zone.classList.remove('drag-over'); // Remove class when item leaves the drop zone
            console.log('Drag leave:', zone.closest('.column').id);
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault(); // Prevent default browser drop behavior
            zone.classList.remove('drag-over'); // Remove drag-over styling
            handleDrop(zone, draggedItem);
        });
    });
});

/**
 * Generates a PDF containing both 'Viernes' and 'Domingo' columns using html2canvas and jsPDF.
 */
async function printAllColumnsToPdf() {
    const button = document.querySelector('.print-all-button');
    const fridayColumn = document.getElementById('friday-column');
    const sundayColumn = document.getElementById('sunday-column');
    const observationsSection = document.getElementById('observations-section');

    if (!fridayColumn || !sundayColumn) {
        console.error("Columnas no encontradas para generar el PDF.");
        return;
    }

    // 1. PREPARAR UI Y MOSTRAR ESTADO DE CARGA
    button.classList.add('loading');
    button.textContent = 'Generando PDF...';

    const uiElementsToHide = [
        fridayColumn.querySelector('.date-time-inputs'),
        sundayColumn.querySelector('.date-time-inputs'),
        fridayColumn.querySelector('.available-collaborators'),
        sundayColumn.querySelector('.available-collaborators')
    ];

    uiElementsToHide.forEach(el => { if (el) el.style.display = 'none'; });

    try {
        // 2. CAPTURAR COLUMNAS
        const canvasFriday = await html2canvas(fridayColumn, { scale: 2, logging: false, useCORS: true });
        const canvasSunday = await html2canvas(sundayColumn, { scale: 2, logging: false, useCORS: true });

        // 3. CONSTRUIR EL PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const titleSpacing = 15;
        const sectionSpacing = 10;
        const availableWidth = pdfWidth - (margin * 2);

        // --- PÁGINA 1: COLUMNAS ---
        let currentY = margin;
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text("Producción - Mesas Viernes y Reunión Domingo", pdfWidth / 2, currentY, { align: 'center' });
        currentY += titleSpacing;

        const fridayTitle = "";//fridayColumn.querySelector('h2').textContent.replace(/\s+/g, ' ').trim();
        const sundayTitle = "";//sundayColumn.querySelector('h2').textContent.replace(/\s+/g, ' ').trim();

        const singleColumnWidth = availableWidth;
        let imgWidthFriday = singleColumnWidth;
        let imgHeightFriday = canvasFriday.height * imgWidthFriday / canvasFriday.width;
        let imgWidthSunday = singleColumnWidth;
        let imgHeightSunday = canvasSunday.height * imgWidthSunday / canvasSunday.width;

        doc.setFontSize(14);
        doc.text(fridayTitle, margin, currentY);
        currentY += sectionSpacing;
        doc.addImage(canvasFriday.toDataURL('image/png'), 'PNG', margin, currentY, imgWidthFriday, imgHeightFriday);
        currentY += imgHeightFriday + titleSpacing;

        if (currentY + imgHeightSunday + titleSpacing > pdfHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
        doc.text(sundayTitle, margin, currentY);
        currentY += sectionSpacing;
        doc.addImage(canvasSunday.toDataURL('image/png'), 'PNG', margin, currentY, imgWidthSunday, imgHeightSunday);

        // --- PÁGINAS SIGUIENTES: OBSERVACIONES (CON PAGINACIÓN INTELIGENTE) ---
        if (observationsSection && observationsSection.classList.contains('show')) {
            doc.addPage();
            let obsY = margin;
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text("Observaciones", pdfWidth / 2, obsY, { align: 'center' });
            obsY += titleSpacing;

            const observationItems = observationsSection.querySelectorAll('.observation-item');

            for (const item of observationItems) {
                const textarea = item.querySelector('.observation-textarea');
                const tempDiv = document.createElement('div');
                tempDiv.className = 'temp-observation-text';
                tempDiv.textContent = textarea.value || textarea.placeholder;
                tempDiv.style.cssText = `
                    flex: 1; padding: 0.75rem; border: 1px solid #cbd5e0; border-radius: 0.375rem;
                    font-size: 1rem; background-color: white; line-height: 1.5; box-sizing: border-box;
                    font-family: inherit; word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word;
                    width: 100%; max-width: none; min-height: 80px;
                    color: ${textarea.value ? '#000' : '#9ca3af'}; font-style: ${textarea.value ? 'normal' : 'italic'};
                `;
                textarea.style.display = 'none';
                item.appendChild(tempDiv);

                const canvasItem = await html2canvas(item, { scale: 2, logging: false, useCORS: true });
                const itemWidth = availableWidth;
                const itemHeight = (canvasItem.height * itemWidth) / canvasItem.width;

                if (obsY + itemHeight > pdfHeight - margin) {
                    doc.addPage();
                    obsY = margin;
                    doc.setFontSize(20);
                    doc.setFont(undefined, 'bold');
                    doc.text("Observaciones.", pdfWidth / 2, obsY, { align: 'center' });
                    obsY += titleSpacing;
                }

                doc.addImage(canvasItem.toDataURL('image/png'), 'PNG', margin, obsY, itemWidth, itemHeight);
                obsY += itemHeight + sectionSpacing;

                item.removeChild(tempDiv);
                textarea.style.display = '';
            }
        }

        // 4. GUARDAR EL PDF
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const filename = `Produccion_Viernes_y_Domingo_${today}.pdf`;
        doc.save(filename);

        showTemporaryMessage('PDF generado exitosamente', 'info');

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        showTemporaryMessage('Error al generar el PDF. Inténtalo de nuevo.', 'error');
    } finally {
        // 5. RESTAURAR LA UI
        uiElementsToHide.forEach(el => { if (el) el.style.display = 'flex'; });
        if (fridayColumn.querySelector('.available-collaborators')) fridayColumn.querySelector('.available-collaborators').style.display = 'block';
        if (sundayColumn.querySelector('.available-collaborators')) sundayColumn.querySelector('.available-collaborators').style.display = 'block';

        button.classList.remove('loading');
        button.textContent = 'Generar (PDF)';
    }
}
