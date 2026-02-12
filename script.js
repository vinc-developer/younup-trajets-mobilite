/**
 * Author: COLAS Vincent
 * Date: 10/2025
 * Description: Génération d'attestation sur l'honneur pour les trajets en mobilité douce.
 * License: 
 * © 2025 COLAS Vincent. Tous droits réservés.
 * 
 * Ce code est la propriété de COLAS Vincent.
 * La reproduction, distribution, ou divulgation de ce code, en
 * totalité ou en partie, est strictement interdite sans l'autorisation
 * explicite de COLAS Vincent.
 * 
 * Pour toute demande d'information ou de licence, veuillez contacter :
 * YOUNUP Nantes
 */

// Variable de configuration
const PRICE_PER_KM = 0.25;
const COMPANY_NAME = "Younup";
const COMPANY_ADDRESS = "7 mail Pablo Picasso - 44000 NANTES";
const LOGO_PATH = "images/logo.png";
const HOLIDAYS = [
    '01-01',
    '05-01',
    '05-08',
    '07-14',
    '08-15',
    '11-01',
    '11-11',
    '12-25',
];

//Variable applicatif
let selectedDays = new Map(); // Map<day, {km, destination}>
let currentMonth = '';
let currentYear = '';
let currentDayEditing = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Définir le mois actuel par défaut
    const today = new Date();
    const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('month-select').value = currentMonthValue;

    // Écouteurs d'événements
    document.getElementById('generate-calendar').addEventListener('click', generateCalendar);
    document.getElementById('generate-pdf').addEventListener('click', generatePDF);
    document.getElementById('confirm-km').addEventListener('click', confirmKm);
    document.getElementById('cancel-km').addEventListener('click', closeModal);

    // Fermer la modal en cliquant en dehors
    document.getElementById('km-modal').addEventListener('click', (e) => {
        if (e.target.id === 'km-modal') {
            closeModal();
        }
    });

    // Confirmer avec Entrée
    document.getElementById('km-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmKm();
        }
    });
});

// Vérifier si un jour est un week-end
function isWeekend(year, month, day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
}

// Vérifier si un jour est un jour férié
function isHoliday(month, day) {
    const dateString = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return HOLIDAYS.includes(dateString);
}

// Générer le calendrier
function generateCalendar() {
    const monthSelect = document.getElementById('month-select').value;

    if (!monthSelect) {
        alert('Veuillez sélectionner un mois');
        return;
    }

    const [year, month] = monthSelect.split('-');
    currentYear = parseInt(year);
    currentMonth = parseInt(month);

    // Réinitialiser les jours sélectionnés
    selectedDays.clear();

    // Créer le calendrier
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = '<h2>Sélectionnez les jours où vous vous êtes déplacé en mobilité douce</h2>';

    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    // En-têtes des jours de la semaine
    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Obtenir le premier jour du mois et le nombre de jours
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    // Ajuster le premier jour (0 = dimanche, on veut 1 = lundi)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;

    // Ajouter des cellules vides avant le premier jour
    for (let i = 1; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendar.appendChild(emptyCell);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.day = day;

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;

        dayCell.appendChild(dayNumber);

        // Vérifier si c'est un week-end ou un jour férié
        if (isWeekend(currentYear, currentMonth, day) || isHoliday(currentMonth, day)) {
            dayCell.classList.add('weekend');
            dayCell.style.cursor = 'not-allowed';
        } else {
            dayCell.addEventListener('click', () => openKmModal(day, dayCell));
        }

        calendar.appendChild(dayCell);
    }

    calendarContainer.appendChild(calendar);
    updateSummary();
}

// Ouvrir la modal pour saisir les kms
function openKmModal(day, element) {
    // Ne pas ouvrir la modal pour les week-ends et les jours fériés
    if (element.classList.contains('weekend')) {
        return;
    }

    currentDayEditing = { day, element };

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    document.getElementById('modal-date').textContent =
        `${day} ${monthNames[currentMonth - 1]} ${currentYear}`;

    // Pré-remplir avec la valeur existante si disponible
    const existingKm = selectedDays.get(day)?.km;
    const existingDestination = selectedDays.get(day)?.destination;
    document.getElementById('km-input').value = existingKm || '';
    document.getElementById('destination-select').value = existingDestination || 'Younup';

    document.getElementById('km-modal').classList.remove('hidden');
    document.getElementById('km-input').focus();
}

// Confirmer les kilomètres
function confirmKm() {
    const destination = document.getElementById('destination-select');
    const kmInput = document.getElementById('km-input');
    const km = parseFloat(kmInput.value);

    if (!km || km <= 0) {
        // Si vide ou 0, supprimer le jour
        if (currentDayEditing) {
            selectedDays.delete(currentDayEditing.day);
            updateDayDisplay(currentDayEditing.day, currentDayEditing.element, null, destination.value);
        }
    } else {
        // Ajouter ou mettre à jour les km
        selectedDays.set(currentDayEditing.day, {km: km, destination: destination.value});
        updateDayDisplay(currentDayEditing.day, currentDayEditing.element, km, destination.value);
    }

    closeModal();
    updateSummary();
}

// Fermer la modal
function closeModal() {
    document.getElementById('km-modal').classList.add('hidden');
    document.getElementById('km-input').value = '';
    currentDayEditing = null;
}

// Mettre à jour l'affichage d'un jour
function updateDayDisplay(day, element, km, destination) {
    // Nettoyer les anciens éléments
    const existingBike = element.querySelector('.bike-icon');
    const existingKm = element.querySelector('.km-display');

    if (existingBike) existingBike.remove();
    if (existingKm) existingKm.remove();

    if (km) {
        element.classList.add('selected');

        if (destination === 'Client') {
            element.style.backgroundColor = '#48bb78';
        } else {
            element.style.backgroundColor = '#fbbe00';
        }

        const bikeIcon = document.createElement('div');
        bikeIcon.className = 'bike-icon';
        bikeIcon.textContent = '🚴‍♂️';
        element.appendChild(bikeIcon);

        const kmDisplay = document.createElement('div');
        kmDisplay.className = 'km-display';
        kmDisplay.textContent = `${km} km`;
        element.appendChild(kmDisplay);
    } else {
        element.classList.remove('selected');
        element.style.backgroundColor = '#ffffff';
    }
}

// Mettre à jour le résumé
function updateSummary() {
    const totalDays = selectedDays.size;
    let totalDistance = 0;

    selectedDays.forEach(data => {
        totalDistance += data.km;
    });

    const totalAmount = totalDistance * PRICE_PER_KM;

    document.getElementById('total-days').textContent = totalDays;
    document.getElementById('total-distance').textContent = totalDistance.toFixed(2);
    document.getElementById('total-amount').textContent = totalAmount.toFixed(2);

    const summaryElement = document.getElementById('summary');
    if (totalDays > 0) {
        summaryElement.classList.remove('hidden');
    } else {
        summaryElement.classList.add('hidden');
    }
}

// Convertir l'image en base64
function getImageDataURL(imagePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            //resolve(canvas.toDataURL('image/png'));
            resolve({
                dataURL: canvas.toDataURL('image/png'),
                width: img.width,
                height: img.height
            });
        };
        img.onerror = function() {
            reject(new Error('Impossible de charger le logo'));
        };
        img.src = imagePath;
    });
}

// Ajouter l'en-tête avec logo sur une page
function addPageHeader(doc, logoData, isFirstPage = false) {
    // Ajouter le logo
    if (logoData) {
        try {
            //doc.addImage(logoData, 'PNG', 20, 8, 25, 10);
            // Définir la largeur souhaitée pour le logo dans le PDF (en mm)
            const desiredWidth = 25;
            const maxHeight = 13; // Hauteur maximale en mm

// Calculer la hauteur proportionnelle pour conserver le ratio
            const aspectRatio = logoData.height / logoData.width;
            let calculatedHeight = desiredWidth * aspectRatio;

// Si la hauteur dépasse la limite, recalculer en fonction de la hauteur max
            if (calculatedHeight > maxHeight) {
                calculatedHeight = maxHeight;
                const calculatedWidth = maxHeight / aspectRatio;
                doc.addImage(logoData.dataURL, 'PNG', 20, 8, calculatedWidth, calculatedHeight);
            } else {
                doc.addImage(logoData.dataURL, 'PNG', 20, 8, desiredWidth, calculatedHeight);
            }
        } catch (e) {
            console.error('Erreur lors de l\'ajout du logo:', e);
        }
    }

    // Nom de l'entreprise
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(251, 190, 0);
    doc.text(COMPANY_NAME, 35, 13);

    // Adresse de l'entreprise (seulement sur la première page)
    if (isFirstPage) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(COMPANY_ADDRESS, 35, 18);
    }

    // Ligne de séparation
    doc.setDrawColor(251, 190, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 22, 190, 22);

    // Réinitialiser la couleur du texte
    doc.setTextColor(0, 0, 0);
}

// Générer le PDF
async function generatePDF() {
    if (selectedDays.size === 0) {
        alert('Veuillez sélectionner au moins un jour');
        return;
    }

    // Vérifier les informations utilisateur
    const userName = document.getElementById('user-name').value.trim().toUpperCase();
    const userFirstname = document.getElementById('user-firstname').value.trim().charAt(0).toUpperCase() + document.getElementById('user-firstname').value.trim().slice(1);
    const userEmail = document.getElementById('user-email').value.trim();
    const userAddress = document.getElementById('user-address').value.trim();

    if (!userName || !userFirstname || !userEmail || !userAddress) {
        alert('Veuillez remplir toutes les informations personnelles (nom, prénom, email, adresse)');
        return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        alert('Veuillez entrer une adresse email valide');
        return;
    }

    // Charger le logo
    let logoData = null;
    try {
        logoData = await getImageDataURL(LOGO_PATH);
    } catch (e) {
        console.warn('Logo non trouvé, génération du PDF sans logo:', e);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // En-tête avec logo et informations entreprise
    addPageHeader(doc, logoData, true);

    // Titre
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Attestation sur l\'honneur - Forfait Mobilités Durable', 105, 35, { align: 'center' });

    // Sous-titre
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Vélo, trottinette et autres mobilités douces', 105, 41, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Informations utilisateur
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Informations du salarié :', 20, 52);
    doc.setFont(undefined, 'normal');
    doc.text(`Je sousisigné(e) : ${userName} ${userFirstname}`, 25, 59);
    doc.text(`Demeurant : ${userAddress}`, 25, 65);
    //doc.text(`Prénom : `, 25, 65);
    doc.text(`Email : ${userEmail}`, 25, 71);
    doc.text(`Atteste sur l'honneur, avoir réalisé les trajets suivants :`, 20, 83);

    // Période
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    doc.setFont(undefined, 'bold');
    doc.text(`Période : ${monthNames[currentMonth - 1]} ${currentYear}`, 20, 95);

    // Tableau des déplacements
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Détail des déplacements :', 20, 105);

    // En-têtes du tableau
    let yPosition = 115;
    doc.setFont(undefined, 'bold');
    doc.text('Date', 25, yPosition);
    doc.text('Destination', 70, yPosition);
    doc.text('Kilomètres', 110, yPosition);
    doc.text('Montant', 160, yPosition);

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 2, 190, yPosition + 2);
    yPosition += 10;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const sortedDays = Array.from(selectedDays.entries()).sort((a, b) => a[0] - b[0]);

    let totalDistance = 0;
    sortedDays.forEach(([day, data]) => {
        if (yPosition > 270) {
            doc.addPage();

            // Répéter l'en-tête sur la nouvelle page
            addPageHeader(doc, logoData, false);

            yPosition = 35;

            // Réafficher les en-têtes du tableau
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Destination', 70, yPosition);
            doc.text('Kilomètres', 110, yPosition);
            doc.text('Montant', 160, yPosition);
            doc.setDrawColor(200, 200, 200);
            doc.line(20, yPosition + 2, 190, yPosition + 2);
            yPosition += 10;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
        }

        const amount = data.km * PRICE_PER_KM;
        totalDistance += data.km;

        doc.text(`${day} ${monthNames[currentMonth - 1]} ${currentYear}`, 25, yPosition);
        doc.text(`${data.destination}`, 70, yPosition);
        doc.text(`${data.km.toFixed(2)} km`, 110, yPosition);
        doc.text(`${amount.toFixed(2)} €`, 160, yPosition);
        yPosition += 7;
    });

    // Ligne de séparation avant le total
    yPosition += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Résumé financier
    const totalAmount = totalDistance * PRICE_PER_KM;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Résumé :', 20, yPosition);
    yPosition += 9;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre de jours : ${selectedDays.size}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Distance totale : ${totalDistance.toFixed(2)} km`, 25, yPosition);
    yPosition += 7;
    doc.text(`Taux de remboursement : ${PRICE_PER_KM} € / km`, 25, yPosition);
    yPosition += 12;

    // Montant total en surbrillance
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(251, 190, 0);
    doc.text(`Montant total à rembourser : ${totalAmount.toFixed(2)} €`, 25, yPosition);
    doc.setTextColor(0, 0, 0);

    // Signature
    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Fait pour servir et valoir ce que de droit.', 20, yPosition - 5);

    // Date de génération
    const today = new Date();
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Fait le : ${today.toLocaleDateString('fr-FR')}`, 20, yPosition - 1);
    doc.setTextColor(0, 0, 0);

    doc.text('Signature du salarié :', 20, yPosition + 12);
    //doc.line(55, yPosition + 12, 105, yPosition + 12);

    // Pied de page avec le nom de l'entreprise
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${COMPANY_NAME} - ${COMPANY_ADDRESS}`, 105, 285, { align: 'center' });

    // Sauvegarder le PDF
    const fileName = `deplacement-mobilite-${userName}-${userFirstname}-${monthNames[currentMonth - 1]}-${currentYear}.pdf`;
    doc.save(fileName);
}