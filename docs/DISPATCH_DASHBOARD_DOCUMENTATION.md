# Dispatch Admin Dashboard - Results and Discussion

## 5.2 System Overview and User Interface

### 5.2.1 Login Page

![Login Page](/screenshots/01-login-page.png)

*Figure 5.2.1 The Login Page*

This is the login page of the Dispatch Admin Dashboard. It requires an email address and password for administrator authentication. The interface features a clean, minimal design with the "Dispatch Admin" branding header, email and password input fields, and a "Sign In" button for credential submission.

### 5.2.2 Dashboard Overview

![Dashboard Overview](/screenshots/02-dashboard-overview.png)

*Figure 5.2.2 The Dashboard Overview Page*

This is the main dashboard overview page displayed after successful authentication. It provides a high-level summary of system statistics including Total Incidents, Resolved Cases, Response Time, and Resolution Rate metrics. The page also displays a list of Recent Incidents for quick access to the latest reports submitted through the system. Navigation to other sections is available through the left sidebar menu.

---

## 5.3 Incident Management

### 5.3.1 Incidents Page

![Incidents Page](/screenshots/03-incidents-page.png)

*Figure 5.3.1 The Incident Management Page*

This is the Incident Management page that displays all reported incidents in a tabular format. The page shows incident statistics including Total Incidents, Pending, In Progress, Unresolved, and Resolved counts. Each incident entry displays the ID, Title, Category, Date & Time, Location, Status, and Trust Level. The page provides action buttons for each incident including "View details", "Assign officers", "Edit", and "Archive" functions.

### 5.3.2 Incident Filtering

![Incident Filtering](/screenshots/04-incidents-filter-status.png)

*Figure 5.3.2 The Incident Filtering Dropdown*

This figure demonstrates the filtering functionality available on the Incidents page. Administrators can filter incidents by Status (All Statuses, Pending, Assigned, In Progress, Resolved, Cancelled), Category, Subcategory, and Trust Level. Additional filtering options include a search textbox for keyword search, date range pickers for filtering by incident date, and a toggle switch for additional filter criteria. These filtering capabilities enable administrators to quickly locate specific incidents based on multiple criteria.

### 5.3.3 Assign Officers Dialog

![Assign Officers Dialog](/screenshots/05-assign-officers-dialog.png)

*Figure 5.3.3 The Assign Officers Dialog*

This is the Assign Officers dialog that appears when clicking the "Assign officers" button on an incident. The dialog allows administrators to search for and select officers to assign to a specific incident report. It includes a search field for finding officers and displays available officers that can be assigned. The dialog provides "Cancel" and "Assign Officer" buttons for managing the assignment process.

### 5.3.4 Incident Details View

![Incident Details](/screenshots/06-incident-details.png)

*Figure 5.3.4 The Incident Details View*

This is the Report Details view that displays comprehensive information about a specific incident. The dialog shows the incident description, assigned officers, and other relevant details. Administrators can view the full context of the report including the description section and any officers currently assigned to handle the incident. A "Close" button is provided to return to the incidents list.

---

## 5.4 Emergency Response

### 5.4.1 Emergencies Page

![Emergencies Page](/screenshots/07-emergencies-page.png)

*Figure 5.4.1 The Emergency Response Coordination Page*

This is the Emergency Response Coordination page that provides real-time emergency monitoring capabilities. The page displays emergency call records in a table format showing User ID, Called Number, Call Time, and Location coordinates (latitude and longitude). Location data can be expanded to view geographical coordinates, enabling administrators to track emergency calls and their origins for coordination purposes.

---

## 5.5 User Management

### 5.5.1 Users Page

![Users Page](/screenshots/08-users-page.png)

*Figure 5.5.1 The User Management Page*

This is the User Management page that displays all registered users in the system. The page shows user statistics including Total Users, Verified Users, and Highly Trusted counts. Each user entry displays the user name, contact email, trust level, number of reports submitted, join date, and last active date. Administrators can filter users by role and trust level using the dropdown menus, and search for specific users using the search field.

### 5.5.2 Trust Score Management

![Trust Score Dialog](/screenshots/09-trust-score-dialog.png)

*Figure 5.5.2 The Edit Trust Score Dialog*

This is the Edit Trust Score dialog that allows administrators to manually adjust user trust levels. The dialog presents four trust level options: Untrusted, Low Trust, Trusted, and Highly Trusted. Administrators can select the appropriate trust level and save changes using the "Save Changes" button. This feature is essential for the trust scoring system, which influences how incidents from different users are prioritized and handled in the dispatch workflow.

---

## 5.6 Officers Management

### 5.6.1 Officers Page

![Officers Page](/screenshots/10-officers-page.png)

*Figure 5.6.1 The Officers Management Page*

This is the Officers Management page that displays all officers registered in the system. The page lists officers in a table format showing Badge Number, First Name, Middle Name, and Last Name. Each officer entry has action buttons for editing, deleting, and managing officer records. An "Add Officer" button at the top allows administrators to register new officers to the system.

### 5.6.2 Add Officer Dialog

![Add Officer Dialog](/screenshots/11-add-officer-dialog.png)

*Figure 5.6.2 The Add Officer Dialog*

This is the Add Officer dialog that appears when clicking the "Add Officer" button. The form requires the Badge Number and Rank as mandatory fields, along with optional fields for Email, First Name, Middle Name, and Last Name. The dialog provides "Create Officer" and "Close" buttons for submitting the new officer record or canceling the operation.

---

## 5.7 Hotlines Management

### 5.7.1 Hotlines Page

![Hotlines Page](/screenshots/12-hotlines-page.png)

*Figure 5.7.1 The Hotlines Management Page*

This is the Hotlines page that manages emergency contact numbers available in the system. The page displays existing hotlines in a table format showing Name, Description, and Phone Number. Each hotline entry has a menu button for editing or deleting the record. An "Add Hotline" button allows administrators to register new emergency contact numbers.

### 5.7.2 Add Hotline Dialog

![Add Hotline Dialog](/screenshots/13-add-hotline-dialog.png)

*Figure 5.7.2 The Add Hotline Dialog*

This is the Add Hotline dialog for creating new emergency contact entries. The form contains three fields: Name (for the hotline organization), Phone number (the contact number), and Description (additional information about the hotline). The dialog provides "Submit" and "Close" buttons for saving the new hotline or canceling the operation.

---

## 5.8 Database Management

### 5.8.1 Database Page

![Database Page](/screenshots/14-database-page.png)

*Figure 5.8.1 The Database Management Page*

This is the Database Management page that allows administrators to manage incident categories and subcategories. The page has two main sections: "Add a new item" form at the top for creating new categories or subcategories, and a "Categories" table below showing existing categories with their associated subcategories. The form includes a dropdown to select the item type (categories), a Name input field, and an Add button to include subcategories. Each category in the table displays its name and all associated subcategories, with action buttons for editing and deleting entries.

![Database Full View](/screenshots/14a-database-full.png)

*Figure 5.8.2 The Database Categories Table (Full View)*

This figure shows the complete database categories table with all existing categories including Violent Crimes, Drug-Related, Traffic Incidents, Other Crimes, and Property Crimes. Each category row displays the category name and all its associated subcategories, enabling administrators to understand the full classification structure used for incident categorization in the system.
