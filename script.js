let date = new Date(); 
let year = date.getFullYear(); 
let month = date.getMonth();
let selectedTime = null;
let enterpriseId = new URLSearchParams(window.location.search).get('enterpriseId');

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let workdaysCache = null;

const fetchWorkdays = async () => {
    try {
        if (workdaysCache === null) {
            const response = await fetch(`http://localhost:9100/api/v2/calendarWidget/workdays/${enterpriseId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch workdays');
            }
            workdaysCache = await response.json();
        }
        return workdaysCache;
    } catch (error) {
        console.error('Error fetching workdays:', error);
        return []; 
    }
};


const isWorkday = async (year, month, day) => {
    try {
        const workdays = await fetchWorkdays();
        const currentMonth = new Date(year, month, day).getMonth();
        return currentMonth === month && workdays.includes(new Date(year, month, day).getDay());
    } catch (error) {
        console.error('Error checking workday:', error);
        return false;
    }
};

const manipulate = async () => {
    try {
        let dayone = new Date(year, month, 1).getDay();
        let lastdate = new Date(year, month + 1, 0).getDate();
        let dayend = new Date(year, month, lastdate).getDay();
        let monthlastdate = new Date(year, month, 0).getDate();

        let lit = ""; 

        for (let i = dayone; i > 0; i--) {
            lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
        }

        for (let i = 1; i <= lastdate; i++) {
            let isToday = i === date.getDate() && month === date.getMonth() && year === date.getFullYear() ? "active" : "";

            let isCurrentMonthWorkday = await isWorkday(year, month, i) ? "" : "disabled";

            lit += `<li class="${isToday} ${isCurrentMonthWorkday}">${i}</li>`;
        }

        for (let i = dayend; i < 6; i++) {
            lit += `<li class="inactive">${i - dayend + 1}</li>`;
        }

        currdate.innerText = `${months[month]} ${year}`;

        day.innerHTML = lit;

        document.querySelectorAll('.calendar-dates li').forEach(date => {
            if (!date.classList.contains('disabled')) {
                date.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-dates li').forEach(date => {
                        date.classList.remove('selected');
                    });
                    date.classList.add('selected');
                    showPopup(date.innerText);
                });
            }
        });
    } catch (error) {
        console.error('Error manipulating calendar:', error);
    }
};

manipulate();

prenexIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        if (month < 0 || month > 11) {
            date = new Date(year, month, new Date().getDate());
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }

        manipulate();
    });
});

function showPopup(selectedDate) {
    const popup = document.getElementById("popup");
    const popupDate = document.getElementById("date");
    const timezoneSelect = document.getElementById("timeZone");

    popupDate.value = `${months[month]} ${selectedDate}, ${year}`;
    popup.style.display = "block";
    populateTimeZones(timezoneSelect);
    populateTimeChips(popupDate.value);

    const saveBtn = document.querySelector(".popup-footer .save-btn");
    saveBtn.disabled = true;

    document.querySelectorAll('#name, #email, #title, #description').forEach(input => {
        input.addEventListener('input', toggleSaveButton);
    });

    timezoneSelect.addEventListener('change', toggleSaveButton);
}

function toggleSaveButton() {
    const saveBtn = document.querySelector(".popup-footer .save-btn");
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const title = document.getElementById('title').value.trim();
    const timeZone = document.getElementById('timeZone').value;
    const selectedTimeValue = selectedTime || ''
    if (name !== '' && email !== '' && title !== '' &&  timeZone !== '' && selectedTimeValue !== '' ) {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
    }
}

function populateTimeZones(timezoneSelect) {
    timezoneSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select timezone';
    timezoneSelect.appendChild(defaultOption);

    moment.tz.names().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        timezoneSelect.appendChild(option);
    });
}

function populateTimeChips(selectedDate) {
    const chipContainer = document.getElementById('timeChips');
    const noChipsMessage = document.getElementById('noChips');

    const date = moment(selectedDate).format('YYYY-MM-DD');
    chipContainer.innerHTML = '';

    fetch(`http://localhost:9100/api/v2/calendarWidget/availableAppointmentTimes/${enterpriseId}/${date}`)
        .then(response => response.json())
        .then(chips => {
            if (chips.length > 0) {
                chips.forEach(chip => {
                    const chipElement = document.createElement('div');
                    chipElement.classList.add('chip');
                    chipElement.textContent = chip;
                    chipElement.addEventListener('click', () => {
                        const selectedChip = chipContainer.querySelector('.chip.selected');
                        if (selectedChip) {
                            selectedChip.classList.remove('selected');
                        }
                        chipElement.classList.add('selected');

                        selectedTime = chip; 
                    });

                    chipContainer.appendChild(chipElement);
                });

                noChipsMessage.style.display = 'none';
            } else {
                noChipsMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('data').innerHTML = 'Failed to load data';
        });
}

document.querySelector(".popup-header .close").addEventListener('click', () => {
    document.getElementById("popup").style.display = "none";
});

document.querySelector(".popup-footer .close-btn").addEventListener('click', () => {
    document.getElementById("popup").style.display = "none";
});

document.querySelector(".popup-footer .save-btn").addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const title = document.getElementById('title').value;
    const selectedDate = document.getElementById('date').value;
    const timeZone = document.getElementById('timeZone').value;
    const description = document.getElementById('description').value;

    const selectedTimeValue = selectedTime || ''; 
    const appointmentData = {
        name: name,
        email: email,
        title: title,
        timeZone: timeZone,
        description: description,
        date: selectedDate,
        time: selectedTimeValue,
        enterpriseId: enterpriseId
    };

    fetch('http://localhost:9100/api/v2/calendarWidget/newAppointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        showToast('Appointment saved successfully');

        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('date').value = '';
        document.getElementById('timeZone').value = '';

        selectedTime = null;

        document.querySelectorAll('.calendar-dates li.selected').forEach(date => {
            date.classList.remove('selected');
        });

        document.querySelector(".popup-footer .save-btn").disabled = true;

        document.getElementById("popup").style.display = "none";
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.style.display = 'block';
    }, 100);

    setTimeout(() => {
        toast.style.display = 'none';
        document.getElementById('toast-container').removeChild(toast);
    }, 3000);
}

