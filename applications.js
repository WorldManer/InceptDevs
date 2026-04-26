let WEBHOOK_URL = null;
let lastSubmitTime = 0;
let cooldownInterval = null;
const COOLDOWN_MINUTES = 10;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

setInterval(() => {
    console.log('%cЗачем вы смотрите в эту консоль?', 'color: red; font-size: 16px; font-weight: bold;');
}, 5000);

console.clear();

async function loadConfig() {
    try {
        const response = await fetch('config.json?v=' + Date.now());
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки');
        }
        
        const config = await response.json();
        
        if (!config.webhook) {
            throw new Error('Webhook не найден');
        }
        
        WEBHOOK_URL = config.webhook;
        
        const loadingEl = document.getElementById('loading');
        const formEl = document.getElementById('survey-form');
        
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        if (formEl) {
            formEl.style.display = 'block';
        }
        
    } catch (error) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = 'Ошибка загрузки<br><button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">Повторить</button>';
        }
    }
}

function startCooldown(button) {
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
    
    const updateButton = () => {
        const now = Date.now();
        const timeLeft = lastSubmitTime + COOLDOWN_MS - now;
        
        if (timeLeft <= 0) {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
            button.disabled = false;
            button.textContent = 'Отправить';
        } else {
            const minutesLeft = Math.ceil(timeLeft / 60000);
            button.disabled = true;
            button.textContent = 'Подождите ' + minutesLeft + ' мин';
        }
    };
    
    updateButton();
    cooldownInterval = setInterval(updateButton, 1000);
}

function checkCooldown(button) {
    const now = Date.now();
    const timeLeft = lastSubmitTime + COOLDOWN_MS - now;
    
    if (timeLeft > 0) {
        const minutesLeft = Math.ceil(timeLeft / 60000);
        button.disabled = true;
        button.textContent = 'Подождите ' + minutesLeft + ' мин';
        startCooldown(button);
        return true;
    }
    
    return false;
}

async function sendToWebhook(data) {
    if (!WEBHOOK_URL) {
        throw new Error('Webhook не загружен');
    }
    
    const embed = {
        title: 'Новая анкета',
        color: 0x5865F2,
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'Discord ник',
                value: '```' + data.discordNick + '```',
                inline: false
            },
            {
                name: 'GitHub профиль',
                value: data.github,
                inline: false
            },
            {
                name: 'Языки программирования',
                value: '```' + data.languages + '```',
                inline: false
            },
            {
                name: 'Возраст',
                value: '```' + data.age + ' лет```',
                inline: true
            },
            {
                name: 'Пол',
                value: '```' + data.gender + '```',
                inline: true
            },
            {
                name: 'Мощность ПК',
                value: '```' + data.power + '/10```',
                inline: true
            },
            {
                name: 'Готов показать проекты',
                value: '```' + data.showProjects + '```',
                inline: true
            },
            {
                name: 'Готов пройти обзвон',
                value: '```' + data.call + '```',
                inline: true
            },
            {
                name: 'Наличие микрофона',
                value: '```' + data.microphone + '```',
                inline: true
            }
        ],
        footer: {
            text: 'Отправлено',
            icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        }
    };
    
    const discordData = {
        embeds: [embed]
    };
    
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordData)
    });

    if (!response.ok) {
        throw new Error('Ошибка отправки');
    }

    if (response.status === 204) {
        return { success: true };
    }
    
    try {
        return await response.json();
    } catch {
        return { success: true };
    }
}

function showMessage(text) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

function getFormData() {
    const discordNick = document.getElementById('discord-nick')?.value.trim();
    const github = document.getElementById('github')?.value.trim();
    const languages = document.getElementById('languages')?.value.trim();
    const age = document.getElementById('age')?.value;
    const showProjects = document.querySelector('input[name="show-projects"]:checked')?.value;
    const call = document.querySelector('input[name="call"]:checked')?.value;
    const microphone = document.querySelector('input[name="microphone"]:checked')?.value;
    const power = document.getElementById('power')?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    
    return {
        timestamp: new Date().toISOString(),
        discordNick: discordNick || 'Не указан',
        github: github || 'Не указан',
        languages: languages || 'Не указано',
        age: age ? parseInt(age) : 0,
        showProjects: showProjects || 'Не указано',
        call: call || 'Не указано',
        microphone: microphone || 'Не указано',
        power: power ? parseInt(power) : 0,
        gender: gender || 'Не указано'
    };
}

function validateForm(data) {
    if (!data.discordNick || data.discordNick === 'Не указан') {
        alert('Пожалуйста, укажите ваш Discord ник');
        return false;
    }
    if (!data.github || data.github === 'Не указан') {
        alert('Пожалуйста, укажите ссылку на GitHub профиль');
        return false;
    }
    if (!data.languages || data.languages === 'Не указано') {
        alert('Пожалуйста, укажите языки программирования');
        return false;
    }
    if (!data.age || data.age < 1 || data.age > 120) {
        alert('Пожалуйста, укажите корректный возраст (1-120)');
        return false;
    }
    if (!data.showProjects || data.showProjects === 'Не указано') {
        alert('Пожалуйста, ответьте на вопрос о проектах');
        return false;
    }
    if (!data.call || data.call === 'Не указано') {
        alert('Пожалуйста, ответьте на вопрос об обзвоне');
        return false;
    }
    if (!data.microphone || data.microphone === 'Не указано') {
        alert('Пожалуйста, ответьте на вопрос о микрофоне');
        return false;
    }
    if (!data.gender || data.gender === 'Не указано') {
        alert('Пожалуйста, укажите ваш пол');
        return false;
    }
    return true;
}

function resetForm() {
    const discordNick = document.getElementById('discord-nick');
    const github = document.getElementById('github');
    const languages = document.getElementById('languages');
    const age = document.getElementById('age');
    const power = document.getElementById('power');
    const powerValue = document.getElementById('power-value');
    
    if (discordNick) discordNick.value = '';
    if (github) github.value = '';
    if (languages) languages.value = '';
    if (age) age.value = '';
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    
    if (power) power.value = 5;
    if (powerValue) powerValue.textContent = 5;
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    
    if (!submitBtn) return;
    
    if (checkCooldown(submitBtn)) {
        showMessage('Подождите ' + COOLDOWN_MINUTES + ' минут перед следующей отправкой');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    try {
        const formData = getFormData();
        
        if (!validateForm(formData)) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
            return;
        }
        
        await sendToWebhook(formData);
        
        lastSubmitTime = Date.now();
        
        showMessage('Анкета отправлена');
        resetForm();
        
        startCooldown(submitBtn);
        
    } catch (error) {
        showMessage('Анкета отправлена');
        resetForm();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    }
}

function setupRangeSlider() {
    const rangeInput = document.getElementById('power');
    const rangeValue = document.getElementById('power-value');
    
    if (rangeInput && rangeValue) {
        rangeInput.addEventListener('input', function() {
            rangeValue.textContent = this.value;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupRangeSlider();
    
    const form = document.getElementById('survey-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    loadConfig();
});
