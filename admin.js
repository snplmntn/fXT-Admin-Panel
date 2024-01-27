"use strict";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  update,
  get,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const apiUrl = 'https://fxt-api.dosshs.online/api';
// const apiUrl = 'http://localhost:1234/api';


let load = false, fetched = false;
let haveUser;
  
  const firebaseConfig = {
      apiKey: "AIzaSyBZBXvvcUmziim1m6LOiwcPZ8pfPxPL4Js",
      authDomain: "finalxtouch-d81ef.firebaseapp.com",
      projectId: "finalxtouch-d81ef",
      storageBucket: "finalxtouch-d81ef.appspot.com",
      messagingSenderId: "531973026813",
      appId: "1:531973026813:web:888570d7e75f42612edf94"
    };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth();


const logout_button = document.querySelector(".signOutBtn");


logout_button.addEventListener("click", function () {
    // Calls the signOut() method to log out the user
    // localStorage.removeItem("userName");
    // localStorage.removeItem("userUID");
  
    auth
      .signOut()
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        // An error happened.
      });
  });

// date options 
const options = { 
  year: 'numeric', 
  month: 'numeric', 
  day: 'numeric', 
  hour: 'numeric', 
  minute: 'numeric', 
  timeZone: 'Asia/Manila'
};

function areDatesInSameWeek(orderCompleteDate) {
  const date1 = new Date()
  const date2 = new Date(orderCompleteDate)

  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;

  // Calculate the day difference between the two dates
  const dayDifference = Math.abs(Math.floor((date2 - date1) / oneWeekInMilliseconds));

  // Check if the day difference is less than or equal to 6 (within the same week)
  return dayDifference <= 6 && date1.getDay() <= date2.getDay();
}

const fetchCustomerCount = async () => {
  try {
    const response = await fetch(`${apiUrl}/account/i`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.count > 0) {
      document.querySelector(".customer-count").innerHTML = data.count;
    } else {
      document.querySelector(".dashboard-amount-1st").innerHTML = "...";
    }
  } catch (err) {
    console.error('Error fetching customer count🐶:', err);
  }
}

const fetchOrder = async () => {
  try {
    const response = await fetch(`${apiUrl}/order/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.count > 0) {
      document.querySelector(".order-count").innerHTML = data.count;
     
    let deliveredOrders = 0, pendingOrders = 0, newOrders = 0, weeklyIncome = 0, totalIncome = 0;

    const orderTBody = document.querySelector('.order-table');

    data.results.reverse().forEach(order => {
      const row = document.createElement('tr');

      const columnsToDisplay = ['orderID', 'dateOrdered', 'name', 'note', 'quantity', 'totalPrice', 'number', 'address', 'userID', 'username', 'paymentMethod', 'status'];

      columnsToDisplay.forEach(column => {
        const cell = document.createElement('td');
          if(column !== "paymentMethod" || column !== "status" || column !== "dateOrdered") {
            cell.textContent = order[column];
          }

          if (column === 'status') {
            cell.textContent = '';
            const select = document.createElement('select');
        
            // Options for the select element
            const statusOptions = ['Status', 'Order Placed', 'Order Confirmed', 'Preparing Order', 'To Deliver', 'Delivery', 'Delivered'];
        
            statusOptions.forEach((option, index) => {
              const optionElement = document.createElement('option');
              optionElement.value = index;
              optionElement.textContent = option;
              select.appendChild(optionElement);
            });
        
            // Set the selected value based on the order's status
            select.value = order[column];

            if(order[column] === 1) newOrders++;
            if(order[column] >= 2 && order[column] <= 5) pendingOrders++;
            if(order[column] === 6) {
              deliveredOrders++;
              if (areDatesInSameWeek(order.dateCompleted)) {
                weeklyIncome+= Number(order["totalPrice"]);
                totalIncome+= Number(order["totalPrice"]);
              } else {
                totalIncome+= Number(order["totalPrice"]);
              }

            }
        
            // Update status when changed
            select.addEventListener('change', async (event) => {
              const statusValue = parseInt(event.target.value, 10);

              await fetch(`${apiUrl}/order?orderID=${order.orderID}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: statusValue }),
              });
            });
        
            cell.appendChild(select);
          }
          
          if (column === 'paymentMethod' && order[column] === 0) {
            cell.textContent = 'Cash on Delivery';
          } else if (column === 'paymentMethod' && order[column] === 1) {
            cell.textContent = 'GCASH';
          } 

          if(column === 'dateOrdered') {
            const originalDateString = order[column];
            const originalDate = new Date(originalDateString);
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(originalDate);
            cell.textContent = parts.map(part => part.value).join('');
          }

          row.appendChild(cell);
      });

    orderTBody.appendChild(row);

    });

    document.querySelector(".delivered-count").innerHTML = deliveredOrders;
    document.querySelector(".pending-count").innerHTML = pendingOrders;
    document.querySelector(".new-count").innerHTML = newOrders;
    document.querySelector(".weekly-income").innerHTML = "PHP " + weeklyIncome;
    document.querySelector(".total-income-php").innerHTML = "PHP " + totalIncome;
    
      
    } else {
      document.querySelector(".order-count").innerHTML = "0";
    }

  } catch (err) {
    console.error('Error fetching Orders🐶:', err);
  }
}

const fetchProductSold = async () => {
  try {
    const response = await fetch(`${apiUrl}/product/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    document.querySelector(".carrot-cupcake-sold").innerHTML = data.results[0].sold;
    document.querySelector(".crinkles-sold").innerHTML = data.results[1].sold;
    document.querySelector(".blueberry-muffin-sold").innerHTML = data.results[2].sold;
    document.querySelector(".tofu-dumplings-sold").innerHTML = data.results[3].sold;


  } catch (err) {
    console.error('Error fetching products sold count🐶:', err);
  }
}

const fetchInventory = async () => {
  try {
    const response = await fetch(`${apiUrl}/inventory/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const inventoryTBody = document.querySelector('.inventory-table');
    const data = await response.json();
    data.results.forEach(ingredient => {
      const row = document.createElement('tr');

      const columnsToDisplay = ['itemId', 'itemName', 'unitOfMeasurement', 'itemQuantity'];

      columnsToDisplay.forEach(column => {
        const cell = document.createElement('td');
        let displayMessage = false;

        if (column === 'itemQuantity') {
          displayMessage = true;
          const input = document.createElement('input');
          input.type = 'number';
          input.value = ingredient[column];

          // Update quantity when changed
          input.addEventListener('input', async (event) => {
            await fetch(`${apiUrl}/inventory?itemId=${ingredient.itemId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ itemQuantity: event.target.value }),
            });
          });

          cell.appendChild(input);
        } else {
          cell.textContent = ingredient[column];
        }

        row.appendChild(cell);

        if(displayMessage) {
          const messageCell = document.createElement('td');
          messageCell.textContent = checkStockMessage(ingredient.itemId, ingredient.itemQuantity)
          row.appendChild(messageCell);
        }
      });

      inventoryTBody.appendChild(row);

    });

  } catch (err) {
    console.error('Error fetching inventory details🐶:', err);
  }
}


function checkStockMessage(itemId, itemQuantity) {
  let message;

    //All-Purpose Flour
  if(itemId === 1) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 1) message = "Low Stock";
    if(itemQuantity >= 1.01) message = "In Stock";

    //Baking Powder
  } else if(itemId === 2) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.2) message = "Low Stock";
    if(itemQuantity >= 0.21) message = "In Stock";

    //Baking Soda
  } else if(itemId === 3) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 100) message = "Low Stock";
    if(itemQuantity >= 100.01) message = "In Stock";

    //Salt
  } else if(itemId === 4) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 50.00) message = "Low Stock";
    if(itemQuantity >= 50.01) message = "In Stock";

    //Ground Cinnamon
  } else if(itemId === 5) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 20) message = "Low Stock";
    if(itemQuantity >= 20.01) message = "In Stock";

    //Ground Ginger
  } else if(itemId === 6) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 20) message = "Low Stock";
    if(itemQuantity >= 20.01) message = "In Stock";

    //Ground Nutmeg
  } else if(itemId === 7) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 10) message = "Low Stock";
    if(itemQuantity >= 10.01) message = "In Stock";

    //Vegetable Oil
  } else if(itemId === 8) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    // Brown Sugar 
  } else if(itemId === 9) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    // Eggs 
  } else if(itemId === 10) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 1 && itemQuantity <= 5) message = "Low Stock";
    if(itemQuantity >= 6) message = "In Stock";

    //Vanilla Extract
  } else if(itemId === 11) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 20) message = "Low Stock";
    if(itemQuantity >= 21.01) message = "In Stock";

    //Carrots
  } else if(itemId === 12) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Raisins
  } else if(itemId === 13) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.2) message = "Low Stock";
    if(itemQuantity >= 0.21) message = "In Stock";

    //Unsalted Butter
  } else if(itemId === 14) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Sugar
  } else if(itemId === 15) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Yogurt
  } else if(itemId === 16) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Milk
  } else if(itemId === 17) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Frozen Blueberries
  } else if(itemId === 18) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.2) message = "Low Stock";
    if(itemQuantity >= 0.21) message = "In Stock";

    //Cream Cheese
  } else if(itemId === 19) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Confectioner's Sugar
  } else if(itemId === 20) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    // Tofu 
  } else if(itemId === 21) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    //Cabbage
  } else if(itemId === 22) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    // Oyster's Sauce
  } else if(itemId === 23) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.5) message = "Low Stock";
    if(itemQuantity >= 0.51) message = "In Stock";

    // Dumpling Wrapper
  } else if(itemId === 24) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 5) message = "Low Stock";
    if(itemQuantity >= 5.01) message = "In Stock";

    // Pepper
  } else if(itemId === 25) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 50) message = "Low Stock";
    if(itemQuantity >= 50.01) message = "In Stock";

    // Chinese 5 Spice
  } else if(itemId === 26) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 10) message = "Low Stock";
    if(itemQuantity >= 10.01) message = "In Stock";

    //Cocoa Power
  } else if(itemId === 27) {
    if(itemQuantity <= 0) message = "No Stock";
    if(itemQuantity >= 0.01 && itemQuantity <= 0.4) message = "Low Stock";
    if(itemQuantity >= .41) message = "In Stock";

  }

  return message;
}

  const fetchData = async () => {
    if(fetched) return
    fetched = true;
    console.log("Fetching Data...")

      await fetchCustomerCount();

      await fetchOrder();
    
      await fetchProductSold()

      await fetchInventory();

    console.log("Fetched data🦴")
    

    
};  

//Checks User's Auth
function checkAuthState() {
  fetchData();
  auth.onAuthStateChanged(function (user) {
    if (load) {
      if (!user) {
        window.location.href = "login.html";
      }
      fetchData();
      haveUser = user;
      load = false;
    }
  });
}

window.addEventListener("load", function () {
  load = true;
  checkAuthState();
});