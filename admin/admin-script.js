// Configuration
let config = {
    users: {},
    defaultConfig: {
        kmOptions: [15, 20, 25],
        defaultKm: 15
    }
};

let currentEditEmail = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();

    // Écouteurs d'événements
    document.getElementById('save-default-config').addEventListener('click', saveDefaultConfig);
    document.getElementById('add-user').addEventListener('click', addUser);
    document.getElementById('search-users').addEventListener('input', filterUsers);
    document.getElementById('export-config').addEventListener('click', exportConfiguration);
    document.getElementById('import-config').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importConfiguration);
    document.getElementById('save-edit').addEventListener('click', saveEdit);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);

    // Fermer la modal en cliquant en dehors
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeEditModal();
        }
    });
});

// Charger la configuration
function loadConfiguration() {
    // Charger depuis le localStorage (simulation)
    const savedConfig = localStorage.getItem('usersConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
    }

    updateDefaultConfigDisplay();
    displayUsers();
}

// Sauvegarder la configuration
function saveConfiguration() {
    localStorage.setItem('usersConfig', JSON.stringify(config));
    showMessage('Configuration sauvegardée avec succès !', 'success');
}

// Mettre à jour l'affichage de la config par défaut
function updateDefaultConfigDisplay() {
    document.getElementById('default-km-options').value = config.defaultConfig.kmOptions.join(', ');
    document.getElementById('default-km-value').value = config.defaultConfig.defaultKm;
}

// Sauvegarder la configuration par défaut
function saveDefaultConfig() {
    const kmOptionsText = document.getElementById('default-km-options').value;
    const defaultKm = parseFloat(document.getElementById('default-km-value').value);

    const kmOptions = kmOptionsText.split(',').map(km => parseFloat(km.trim())).filter(km => !isNaN(km));

    if (kmOptions.length === 0) {
        showMessage('Veuillez entrer au moins une option de kilomètres', 'error');
        return;
    }

    if (isNaN(defaultKm) || !kmOptions.includes(defaultKm)) {
        showMessage('La valeur par défaut doit être l\'une des options proposées', 'error');
        return;
    }

    config.defaultConfig = {
        kmOptions: kmOptions.sort((a, b) => a - b),
        defaultKm: defaultKm
    };

    saveConfiguration();
}

// Ajouter un utilisateur
function addUser() {
    const email = document.getElementById('new-user-email').value.trim();
    const name = document.getElementById('new-user-name').value.trim();
    const firstname = document.getElementById('new-user-firstname').value.trim();
    const kmOptionsText = document.getElementById('new-user-km-options').value;
    const defaultKm = parseFloat(document.getElementById('new-user-default-km').value);

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return;
    }

    // Vérifier si l'utilisateur existe déjà
    if (config.users[email]) {
        showMessage('Cet utilisateur existe déjà', 'error');
        return;
    }

    // Parser les options de km
    const kmOptions = kmOptionsText.split(',').map(km => parseFloat(km.trim())).filter(km => !isNaN(km));

    if (kmOptions.length === 0) {
        showMessage('Veuillez entrer au moins une option de kilomètres', 'error');
        return;
    }

    if (isNaN(defaultKm) || !kmOptions.includes(defaultKm)) {
        showMessage('La valeur par défaut doit être l\'une des options proposées', 'error');
        return;
    }

    // Ajouter l'utilisateur
    config.users[email] = {
        name: name || '',
        firstname: firstname || '',
        kmOptions: kmOptions.sort((a, b) => a - b),
        defaultKm: defaultKm
    };

    saveConfiguration();
    displayUsers();

    // Réinitialiser le formulaire
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-firstname').value = '';
    document.getElementById('new-user-km-options').value = '';
    document.getElementById('new-user-default-km').value = '';
}

// Afficher les utilisateurs
function displayUsers() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';

    const emails = Object.keys(config.users);

    if (emails.length === 0) {
        usersList.innerHTML = '<p style="text-align: center; color: var(--text-medium); padding: 20px;">Aucun utilisateur configuré</p>';
        return;
    }

    emails.sort().forEach(email => {
        const user = config.users[email];
        const userCard = createUserCard(email, user);
        usersList.appendChild(userCard);
    });
}

// Créer une carte utilisateur
function createUserCard(email, user) {
    const card = document.createElement('div');
    card.className = 'user-card';

    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';

    const userEmail = document.createElement('div');
    userEmail.className = 'user-email';
    userEmail.textContent = email;

    const userName = document.createElement('div');
    userName.className = 'user-name';
    userName.textContent = user.name && user.firstname ? `${user.firstname} ${user.name}` : 'Nom non renseigné';

    const kmOptionsDiv = document.createElement('div');
    kmOptionsDiv.className = 'user-km-options';

    user.kmOptions.forEach(km => {
        const badge = document.createElement('span');
        badge.className = 'km-badge';
        if (km === user.defaultKm) {
            badge.classList.add('default');
        }
        badge.textContent = `${km} km`;
        kmOptionsDiv.appendChild(badge);
    });

    userInfo.appendChild(userEmail);
    userInfo.appendChild(userName);
    userInfo.appendChild(kmOptionsDiv);

    const actions = document.createElement('div');
    actions.className = 'user-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = '✏️ Modifier';
    editBtn.addEventListener('click', () => openEditModal(email));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '🗑️ Supprimer';
    deleteBtn.addEventListener('click', () => deleteUser(email));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(userInfo);
    card.appendChild(actions);

    return card;
}

// Ouvrir la modal de modification
function openEditModal(email) {
    currentEditEmail = email;
    const user = config.users[email];

    document.getElementById('edit-email').value = email;
    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-firstname').value = user.firstname || '';
    document.getElementById('edit-km-options').value = user.kmOptions.join(', ');
    document.getElementById('edit-default-km').value = user.defaultKm;

    document.getElementById('edit-modal').classList.remove('hidden');
}

// Fermer la modal de modification
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditEmail = null;
}

// Sauvegarder les modifications
function saveEdit() {
    if (!currentEditEmail) return;

    const name = document.getElementById('edit-name').value.trim();
    const firstname = document.getElementById('edit-firstname').value.trim();
    const kmOptionsText = document.getElementById('edit-km-options').value;
    const defaultKm = parseFloat(document.getElementById('edit-default-km').value);

    const kmOptions = kmOptionsText.split(',').map(km => parseFloat(km.trim())).filter(km => !isNaN(km));

    if (kmOptions.length === 0) {
        showMessage('Veuillez entrer au moins une option de kilomètres', 'error');
        return;
    }

    if (isNaN(defaultKm) || !kmOptions.includes(defaultKm)) {
        showMessage('La valeur par défaut doit être l\'une des options proposées', 'error');
        return;
    }

    config.users[currentEditEmail] = {
        name: name,
        firstname: firstname,
        kmOptions: kmOptions.sort((a, b) => a - b),
        defaultKm: defaultKm
    };

    saveConfiguration();
    displayUsers();
    closeEditModal();
}

// Supprimer un utilisateur
function deleteUser(email) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ?`)) {
        delete config.users[email];
        saveConfiguration();
        displayUsers();
    }
}

// Filtrer les utilisateurs
function filterUsers() {
    const searchTerm = document.getElementById('search-users').value.toLowerCase();
    const userCards = document.querySelectorAll('.user-card');

    userCards.forEach(card => {
        const email = card.querySelector('.user-email').textContent.toLowerCase();
        const name = card.querySelector('.user-name').textContent.toLowerCase();

        if (email.includes(searchTerm) || name.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Exporter la configuration
function exportConfiguration() {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-config.json';
    link.click();

    URL.revokeObjectURL(url);
    showMessage('Configuration exportée avec succès !', 'success');
}

// Importer la configuration
function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedConfig = JSON.parse(e.target.result);

            // Valider la structure
            if (!importedConfig.users || !importedConfig.defaultConfig) {
                throw new Error('Structure de configuration invalide');
            }

            config = importedConfig;
            saveConfiguration();
            updateDefaultConfigDisplay();
            displayUsers();
            showMessage('Configuration importée avec succès !', 'success');
        } catch (error) {
            showMessage('Erreur lors de l\'importation : ' + error.message, 'error');
        }
    };
    reader.readAsText(file);

    // Réinitialiser l'input file
    event.target.value = '';
}

// Afficher un message
function showMessage(text, type) {
    // Supprimer les anciens messages
    const oldMessages = document.querySelectorAll('.message');
    oldMessages.forEach(msg => msg.remove());

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    const container = document.querySelector('.container');
    container.insertBefore(message, container.firstChild);

    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Supprimer le message après 5 secondes
    setTimeout(() => {
        message.remove();
    }, 5000);
}