# ShareBite 🍔🍕
**SAP ABAP Food Order Management System using RAP, CDS, OData, and Web Client**

ShareBite is a hybrid food order management system that bridges a modern HTML5/JS/CSS web application frontend with an enterprise SAP ABAP RESTful Application Programming (RAP) backend. It features database tables, Core Data Services (CDS) views, transactional behavior definitions, service definitions, and a responsive client interface.

---

## 📂 Repository Structure

The project code is divided into two primary directories:

### 1. `sharebite/` (Web Application Frontend)
A lightweight and interactive management interface for clients and kitchen staff:
- **`index.html`**: The main page housing the login portal, interactive menu selection, active order list, customer list, and invoice details.
- **`styles/`**: Custom styling with CSS featuring modern gradients, clean typography, responsive layouts, and transitions.
- **`controllers/`**: JS modules orchestrating frontend states (e.g., Auth, Dashboard, Menu, Customers, Invoices, and Orders).
- **`utils/`**: Helper files containing reusable validation and formatting logic.
- **`assets/`**: UI images and food catalog resources.

### 2. `sap_project/` (SAP ABAP & RAP Backend Resources)
The ABAP development elements saved directly from the Eclipse ADT workspace:

#### 🔹 Business Services
- **Service Definitions (`ZUI_FOOD_SERVICE`)**: Exposes the root projection views (`ZC_FOOD_MENU`, `ZC_CUSTOMERS`, `ZC_ORDERS`, `ZC_ORDER_ITEMS`) as an OData service.

#### 🔹 Core Data Services (Data Definitions)
- **Root View Entities**:
  - `ZI_CUSTOMERS`: Selects customer details from the database table.
  - `ZI_FOOD_MENU`: Selects available food items and prices from the database table.
  - `ZI_ORDERS`: Holds customer order master details (total amount, currency, status).
  - `ZI_ORDER_ITEMS`: Resolves items, quantities, and foreign keys associated with each order.
- **Projection Views**:
  - `ZC_CUSTOMERS`, `ZC_FOOD_MENU`, `ZC_ORDERS`, `ZC_ORDER_ITEMS` acting as transactional query contracts exposed to the Service Definition.
- **Custom Views**:
  - `ZI_PRO1`: An inner join view combining sales header (`VBAK`) and sales items (`VBAP`) tables.

#### 🔹 Behavior Definitions (BDEF)
- **Transactional Support**: Enable standard transactional operations (`Create`, `Update`, `Delete`) on both the database CDS layers (`ZI_*`) and projection layers (`ZC_*`).
- **Unique Implementations**: Link back to custom unique handler classes (e.g. `zbp_i_customers`, `zbp_i_food_menu`, etc.) to handle custom business logic.

#### 🔹 Dictionary Tables (Database Tables)
- Transparent tables defining the persistent schema:
  - `zcustomerss`: Customer table with fields for Name, Phone, and Address.
  - `zfood_menu`: Food menu details featuring amount semantics linked to currency code.
  - `zorders`: Orders table featuring standard foreign key relations constraint check mapped against customer details.
  - `zorder_items`: Order items list with compound primary keys (`order_id`, `food_id`) and screen-check foreign key constraints mapped back to orders and menus.

---

## 🛠️ Tech Stack & Features

- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6 Modules)
- **Backend Architecture**: SAP RAP (RESTful Application Programming)
- **Database Layer**: ABAP CDS (Core Data Services) Views, Transparent Dictionary Tables
- **Development Tools**: Eclipse IDE ADT (ABAP Development Tools)
- **Git Integration**: Fully versioned using standard conventions and pushed to Github.

---

## 🚀 How to Import to SAP Eclipse (ADT)

1. Connect to your SAP System in **Eclipse ADT**.
2. Create or navigate to your ABAP Package.
3. Open the file corresponding to the object you want to create (e.g., `sap_project/Core Data Services/Data Definitions/ZC_CUSTOMERS.asddls`).
4. Copy the code from the file (or the `.txt` equivalent) and paste it into Eclipse.
5. Activate the CDS views, Behavior Definitions, and Service Definition.
6. Publish the local OData service binding to start consuming the service!

---

## 📸 SAP System Screenshots

### 1. Eclipse ADT Project Structure
![Eclipse Project Structure](screenshots/02_Eclipse_Project_Structure.png)

### 2. Core Data Services (CDS Views)
* **Customers View (`ZI_CUSTOMERS`)**:
![Customers CDS View](screenshots/03_CDS_View_Customers.png)

* **Food Menu View (`ZI_FOOD_MENU`)**:
![Food Menu CDS View](screenshots/04_CDS_View_FoodMenu.png)

### 3. Behavior Definitions
* **Customers Behavior (`ZI_CUSTOMERS`)**:
![Behavior Definition](screenshots/05_Behavior_Definition.png)

### 4. Service Bindings
![Service Binding](screenshots/07_Service_Binding.png)

### 5. Dictionary Tables & Data
* **Customers Table (`ZCUSTOMERSS`) Structure**:
![Customers Table](screenshots/11_Table_Customers.png)

* **Customers Table (`ZCUSTOMERSS`) Data Select**:
![Customers Table Data](screenshots/11_Table_Customers_Data.png)

* **Food Menu Table (`ZFOOD_MENU`) Structure**:
![Food Menu Table](screenshots/12_Table_FoodMenu.png)

* **Food Menu Table (`ZFOOD_MENU`) Data Select**:
![Food Menu Table Data](screenshots/12_Table_FoodMenu_Data.png)

* **Orders Table (`ZORDERS`) Structure**:
![Orders Table](screenshots/13_Table_Orders.png)

* **Orders Table (`ZORDERS`) Data Select**:
![Orders Table Data](screenshots/13_Table_Orders_Data.png)

* **Order Items Table (`ZORDER_ITEMS`) Structure**:
![Order Items Table](screenshots/13_Table_OrderItems.png)

* **Order Items Table (`ZORDER_ITEMS`) Data Select**:
![Order Items Table Data](screenshots/13_Table_OrderItems_Data.png)

---

## 🖥️ Frontend Web Client Screenshots

### 1. Login Page
![Login Page](screenshots/14_Login_Page.png)

### 2. Register/Create Account Page
![Register Page](screenshots/14_Register_Page.png)

### 3. Dashboard Analytical Overview
![Dashboard Overview](screenshots/15_Dashboard_Overview.png)

### 4. Dashboard Charts & Recent Orders
![Dashboard Charts](screenshots/15_Dashboard_Charts.png)

### 5. Food Menu Registry
![Food Menu Registry](screenshots/16_Food_Menu.png)

### 6. Customer Management
![Customer Management](screenshots/17_Customer_Management.png)

### 7. Customer Export (CSV Downloaded)
![Customer Export](screenshots/17_Customer_Export.png)

### 8. Orders Management & Live Timeline Tracker
![Orders Management](screenshots/18_Order_Management.png)

### 9. Orders Export (CSV Downloaded)
![Orders Export](screenshots/18_Order_Export.png)

### 10. Invoice Generation Panel
![Invoice Generation](screenshots/19_Invoice_Generation.png)

### 11. Invoice JSON Export (Downloaded)
![JSON Export](screenshots/20_JSON_Export.png)

### 12. Delivery Agent Order Portal
![Delivery Agent Portal](screenshots/21_Delivery_Agent_View.png)

### 13. Customer Dashboard View (POV)
![Customer POV Dashboard](screenshots/22_Customer_POV_Dashboard.png)






