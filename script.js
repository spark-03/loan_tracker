const SUPABASE_URL = "https://jstzxrltbyzulwbhvrfq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHp4cmx0Ynl6dWx3Ymh2cmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjA4NDcsImV4cCI6MjA5MzczNjg0N30.vGSvVyX6TqJEycpkeZpnfdDq1hFiMp4QcYojjjZJCAY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
console.log("Supabase Connected");
async function saveCustomer() {

  const token = document.getElementById("token").value;
  const ladyName = document.getElementById("ladyName").value;
  const husbandName = document.getElementById("husbandName").value;
  const phone = document.getElementById("phone").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const issueDate = document.getElementById("issueDate").value;

  const monthlyDue = amount * 0.24;

  const payments = [
    {month: 1, paid: false},
    {month: 2, paid: false},
    {month: 3, paid: false},
    {month: 4, paid: false},
    {month: 5, paid: false}
  ];

  const { error } = await supabaseClient
    .from("customers")
    .insert([
      {
        token,
        lady_name: ladyName,
        husband_name: husbandName,
        phone,
        amount,
        issue_date: issueDate,
        monthly_due: monthlyDue,
        status: "ACTIVE",
        payments
      }
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Customer Saved!");

  clearInputs();

  loadDashboard();
  loadCollections();
}
  
function clearInputs() {
  document.getElementById("token").value = "";
  document.getElementById("ladyName").value = "";
  document.getElementById("husbandName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("issueDate").value = "";
}

function searchCustomer() {

  const searchToken = document.getElementById("searchToken").value;

  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  const customer = customers.find(c => c.token === searchToken);

  const result = document.getElementById("result");

  if (!customer) {
    result.innerHTML = "<p>Customer Not Found</p>";
    return;
  }

  let paymentsHTML = "";

  customer.payments.forEach((p, index) => {

  paymentsHTML += `
    <div class="payment">

      <strong>Month ${p.month}</strong>

      <p>
        Status:
        ${p.paid ? "Paid" : "Pending"}
      </p>

      ${
        p.paid
        ? `<p>Paid Date: ${p.paidDate}</p>`
        : ""
      }

      ${
        p.paid
        ? `<p>Amount Paid: ₹${p.amount}</p>`
        : ""
      }

      ${
        !p.paid
        ? `
          <button onclick="markPaid('${customer.token}', ${index})">
            Mark Paid
          </button>
        `
        : ""
      }

    </div>
  `;
});
  result.innerHTML = `
    <h3>${customer.ladyName}</h3>
    <p>Token: ${customer.token}</p>
    <p>Husband Name: ${customer.husbandName}</p>
    <p>Phone: ${customer.phone}</p>
    <p>Status: ${customer.status}</p>
    <p>Loan Amount: ₹${customer.amount}</p>
    <p>Issue Date: ${customer.issueDate}</p>
    <p>Monthly Due: ₹${customer.monthlyDue}</p>

    ${paymentsHTML}
  `;
}

function markPaid(token, paymentIndex) {

  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  const customerIndex = customers.findIndex(c => c.token === token);

  const today = new Date().toLocaleDateString();

  customers[customerIndex].payments[paymentIndex] = {
    month: paymentIndex + 1,
    paid: true,
    amount: customers[customerIndex].monthlyDue,
    paidDate: today
  };

  const allPaid = customers[customerIndex].payments.every(p => p.paid);

  customers[customerIndex].status = allPaid ? "COMPLETED" : "ACTIVE";

  localStorage.setItem("customers", JSON.stringify(customers));
  loadDashboard();
  loadCollections();

  searchCustomer();
}
async function loadDashboard() {

  let customers = await getCustomers();

  let totalCustomers = customers.length;

  let lastToken = 0;

  if (customers.length > 0) {
    lastToken = customers[customers.length - 1].token;
  }

  let activeLoans = customers.filter(c => c.status === "ACTIVE").length;

  let completedLoans = customers.filter(c => c.status === "COMPLETED").length;

  let totalAmount = customers.reduce((sum, c) => sum + Number(c.amount), 0);

  let monthlyCollection = customers
    .filter(c => c.status === "ACTIVE")
    .reduce((sum, c) => sum + Number(c.monthly_due), 0);

  document.getElementById("totalCustomers").innerText = totalCustomers;

  document.getElementById("lastToken").innerText = lastToken;

  document.getElementById("activeLoans").innerText = activeLoans;

  document.getElementById("completedLoans").innerText = completedLoans;

  document.getElementById("totalAmount").innerText = totalAmount;

  document.getElementById("monthlyCollection").innerText = monthlyCollection;
}


async function loadCollections() {

  let customers = await getCustomers();

  let collectionHTML = "";

  customers.forEach(customer => {

    if (customer.status === "ACTIVE") {

      const pendingPayment = customer.payments.find(p => !p.paid);

      if (pendingPayment) {

        collectionHTML += `
          <div class="payment">
            <p><strong>${customer.lady_name}</strong></p>

            <p>Token: ${customer.token}</p>

            <p>Due Amount: ₹${customer.monthly_due}</p>

            <p>Month: ${pendingPayment.month}</p>
          </div>
        `;
      }
    }
  });

  document.getElementById("collectionList").innerHTML = collectionHTML;
}
function createGroup() {

  const groupName = document.getElementById("groupName").value;

  if (!groupName) {
    alert("Enter group name");
    return;
  }

  let groups = JSON.parse(localStorage.getItem("groups")) || [];

  groups.push({
    name: groupName,
    members: []
  });

  localStorage.setItem("groups", JSON.stringify(groups));

  loadGroups();

  alert("Group Created!");

  document.getElementById("groupName").value = "";
}
function loadGroups() {

  let groups = JSON.parse(localStorage.getItem("groups")) || [];

  const groupSelect = document.getElementById("groupSelect");

  const groupsList = document.getElementById("groupsList");

  groupSelect.innerHTML = "";

  groupsList.innerHTML = "";

  groups.forEach((group, index) => {

    groupSelect.innerHTML += `
      <option value="${index}">
        ${group.name}
      </option>
    `;

    groupsList.innerHTML += `
      <div class="payment">

        <strong>${group.name}</strong>

        <br><br>

        <button onclick="viewGroup(${index})">
          View Group
        </button>

      </div>
    `;
  });
}
//addtogroup function//
function addToGroup() {

  const token = document.getElementById("groupToken").value;

  const groupIndex = document.getElementById("groupSelect").value;

  let groups = JSON.parse(localStorage.getItem("groups")) || [];

  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  const customer = customers.find(c => c.token === token);

  if (!customer) {
    alert("Customer not found!");
    return;
  }

  groups[groupIndex].members.push(token);

  localStorage.setItem("groups", JSON.stringify(groups));

  alert("Customer added to group!");

  document.getElementById("groupToken").value = "";
}
loadGroups();

function viewGroup(groupIndex) {

  let groups = JSON.parse(localStorage.getItem("groups")) || [];

  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  const group = groups[groupIndex];

  const groupMembers = document.getElementById("groupMembers");

  groupMembers.innerHTML = "";

  if (group.members.length === 0) {

    groupMembers.innerHTML = "<p>No members in this group</p>";

    return;
  }

  group.members.forEach(token => {

    const customer = customers.find(c => c.token === token);

    if (!customer) return;

    const pendingPayment = customer.payments.find(p => !p.paid);

    groupMembers.innerHTML += `
      <div class="payment">

        <strong>${customer.ladyName}</strong>

        <p>Token: ${customer.token}</p>

        <p>Phone: ${customer.phone}</p>

        <p>Monthly Due: ₹${customer.monthlyDue}</p>

        <p>
          Current Month:
          ${pendingPayment ? pendingPayment.month : "Completed"}
        </p>

        <p>Status: ${customer.status}</p>

      </div>
    `;
  });
}
async function getCustomers() {

  const { data, error } = await supabaseClient
    .from("customers")
    .select("*");

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}
async function getCustomers() {

  const { data, error } = await supabaseClient
    .from("customers")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}