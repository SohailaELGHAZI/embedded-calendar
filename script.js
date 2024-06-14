let date = new Date(); // creates a new date object with the current date and time
let year = date.getFullYear(); // gets the current year
let month = date.getMonth(); // gets the current month (index based, 0-11)
let selectedTime = null;

const day = document.querySelector(".calendar-dates"); // selects the element with class "calendar-dates"
const currdate = document.querySelector(".calendar-current-date"); // selects the element with class "calendar-current-date"
const prenexIcons = document.querySelectorAll(".calendar-navigation span"); // selects all elements with class "calendar-navigation span"

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]; // array of month names

// function to generate the calendar
const manipulate = () => {
    // get the first day of the month
    let dayone = new Date(year, month, 1).getDay();

    // get the last date of the month
    let lastdate = new Date(year, month + 1, 0).getDate();

    // get the day of the last date of the month
    let dayend = new Date(year, month, lastdate).getDay();

    // get the last date of the previous month
    let monthlastdate = new Date(year, month, 0).getDate();

    let lit = ""; // variable to store the generated calendar HTML

    // loop to add the last dates of the previous month
    for (let i = dayone; i > 0; i--) {
        lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    // loop to add the dates of the current month
    for (let i = 1; i <= lastdate; i++) {
        // check if the current date is today
        let isToday = i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? "active" : "";
        lit += `<li class="${isToday}">${i}</li>`;
    }

    // loop to add the first dates of the next month
    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`;
    }

    // update the text of the current date element with the formatted current month and year
    currdate.innerText = `${months[month]} ${year}`;

    // update the HTML of the dates element with the generated calendar
    day.innerHTML = lit;

    // Add click event listeners to each date
    document.querySelectorAll('.calendar-dates li').forEach(date => {
        date.addEventListener('click', () => {
            document.querySelectorAll('.calendar-dates li').forEach(date => {
                date.classList.remove('selected');
            });
            date.classList.add('selected');
            showPopup(date.innerText);
        });
    });
};

manipulate();

// Attach a click event listener to each icon
prenexIcons.forEach(icon => {
    // When an icon is clicked
    icon.addEventListener("click", () => {
        // Check if the icon is "calendar-prev" or "calendar-next"
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        // Check if the month is out of range
        if (month < 0 || month > 11) {
            // Set the date to the first day of the month with the new year
            date = new Date(year, month, new Date().getDate());
            // Set the year to the new year
            year = date.getFullYear();
            // Set the month to the new month
            month = date.getMonth();
        } else {
            // Set the date to the current date
            date = new Date();
        }

        // Call the manipulate function to update the calendar display
        manipulate();
    });
});

// Function to show the popup
function showPopup(selectedDate) {
    const popup = document.getElementById("popup");
    const popupDate = document.getElementById("date");
    const timezoneSelect = document.getElementById("timeZone"); // Select the timezone select element

    popupDate.value = `${months[month]} ${selectedDate}, ${year}`;
    popup.style.display = "block";
    populateTimeZones(timezoneSelect);
    populateTimeChips(popupDate.value);
}

function populateTimeZones(timezoneSelect) {
    // Clear existing options
    timezoneSelect.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select timezone';
    timezoneSelect.appendChild(defaultOption);

    // Populate with moment-timezone names
    moment.tz.names().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        timezoneSelect.appendChild(option);
    })
}
function populateTimeChips(selectedDate) {
    const chipContainer = document.getElementById('timeChips');
    const noChipsMessage = document.getElementById('noChips');
    const enterpriseId = new URLSearchParams(window.location.search).get('enterpriseId');

   // const enterpriseId = '17caf2d8-5f84-4940-a135-3f8069ea3744';
    const date = moment(selectedDate).format('YYYY-MM-DD');
    // Clear existing chips
    chipContainer.innerHTML = '';

    fetch(`http://localhost:9100/api/v2/calendarWidget/availableAppointmentTimes/${enterpriseId}/${date}`)
        .then(response => response.json())
        .then(chips => {
            if (chips.length > 0) {
                chips.forEach(chip => {
                    const chipElement = document.createElement('div');
                    chipElement.classList.add('chip');
                    chipElement.textContent = chip; // Directly assign each time slot from chips array

                    chipElement.addEventListener('click', () => {
                        // Deselect previously selected chip (if any)
                        const selectedChip = chipContainer.querySelector('.chip.selected');
                        if (selectedChip) {
                            selectedChip.classList.remove('selected');
                        }
                        // Select the clicked chip
                        chipElement.classList.add('selected');
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

// Close the popup when the close button is clicked
document.querySelector(".popup-header .close").addEventListener('click', () => {
    document.getElementById("popup").style.display = "none";
});

document.querySelector(".popup-footer .close-btn").addEventListener('click', () => {
    document.getElementById("popup").style.display = "none";
});

// Handle form submission
document.querySelector(".popup-footer .save-btn").addEventListener('click', () => {
    // Handle form data here (validate, save, etc.)
    // For demonstration, simply close the popup
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const title = document.getElementById('title').value;
    const selectedDate = document.getElementById('date').value;
    const timeZone = document.getElementById('timeZone').value;
    const description = document.getElementById('description').value;

    // Retrieve selected time from the selectedTime variable
    const selectedTimeValue = selectedTime ? selectedTime.textContent : '';

    // Log form data (for demonstration)
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Title:', title);
    console.log('Date:', selectedDate);
    console.log('Timezone:', timeZone);
    console.log('Description:', description);
    console.log('Selected Time:', selectedTimeValue);

    // Reset selectedTime variable for next use
    selectedTime = null;

    document.getElementById("popup").style.display = "none";
});
