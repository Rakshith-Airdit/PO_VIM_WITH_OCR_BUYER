sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat"
  ],
  (Controller, Filter, FilterOperator, DateFormat) => {
    "use strict";

    return Controller.extend(
      "com.povimwithocrbuyer.povimwithocrbuyer.controller.InvoiceList",
      {
        onInit() {
          this.getView().byId("idSmartFilterBarPending").setVisible(true);
        },
        onInvoiceItemPress: function (oEvent) {
          const selectedItem = oEvent.getSource();
          const context = selectedItem.getBindingContext();
          const reqNumber = context.getProperty("REQUEST_NO");
          const status = context.getProperty("STATUS_DESC");

          this.getOwnerComponent().getRouter().navTo("RouteInvoiceDetails", {
            reqNumber,
          });
        },
        // onIconTabBarSelect: function (oEvent) {
        //   const oIconTabBar = oEvent.getSource();
        //   const sSelectedKey = oIconTabBar.getSelectedKey();

        //   // Get the ID of the SmartTable based on the selected tab key
        //   let sSmartTableId;
        //   if (sSelectedKey.includes("idPendingInvoices")) {
        //     sSmartTableId = "idPendingInvoicesTable";
        //   } else if (sSelectedKey.includes("idApprovedInvoices")) {
        //     sSmartTableId = "idApprovedInvoicesTable";
        //   } else if (sSelectedKey.includes("idRejectedInvoices")) {
        //     sSmartTableId = "idRejectedInvoicesTable";
        //   }

        //   // Find the SmartTable control
        //   const oSmartTable = this.byId(sSmartTableId);

        //   // Set busy state and rebind the table
        //   if (oSmartTable) {
        //     // oSmartTable.setBusy(true);
        //     oSmartTable.rebindTable(true);
        //   }
        // },

        onIconTabBarSelect: function (oEvent) {
          const oIconTabBar = oEvent.getSource();
          const selectedKey = oEvent.getParameter("key");
          const smartFilterPending = this.getView().byId("idSmartFilterBarPending")
          const smartFilterApproved = this.getView().byId("idSmartFilterBarApproved")
          const smartFilterRejected = this.getView().byId("idSmartFilterBarRejected")

          if (selectedKey === "PendingInvoices") {
            const oSmartTable = this.byId("idPendingInvoicesTable");
            if (oSmartTable) {
              oSmartTable.rebindTable();
              smartFilterPending.setVisible(true);
              smartFilterApproved.setVisible(false);
              smartFilterRejected.setVisible(false);
            }
          } else if (selectedKey === "ApprovedInvoices") {
            const oSmartTable = this.byId("idApprovedInvoicesTable");
            if (oSmartTable) {
              oSmartTable.rebindTable();
              smartFilterPending.setVisible(false);
              smartFilterApproved.setVisible(true);
              smartFilterRejected.setVisible(false);
            }
          } else if (selectedKey === "RejectedInvoices") {
            const oSmartTable = this.byId("idRejectedInvoicesTable");
            if (oSmartTable) {
              oSmartTable.rebindTable();
              smartFilterPending.setVisible(false);
              smartFilterApproved.setVisible(false);
              smartFilterRejected.setVisible(true);
            }
          }
        },

        formatStatusState: function (sStatus) {
          // Check if sStatus is null or undefined
          if (!sStatus) {
            return "None"; // or any other default state like "Indication05"
          }

          // Now, perform the status check
          if (sStatus.toLowerCase().includes("in-process")) {
            return "Indication17";
          } else if (sStatus === "Approved") {
            return "Indication13";
          } else if (sStatus === "Rejected") {
            return "Indication11";
          }
          return "None";
        },

        formatRequestNumber: function (sValue) {
          if (typeof sValue === "string") {
            return sValue.replace(/,/g, "");
          }
          return sValue;
        },

        onRebindPending: function (oEvent) {
          let tParm = oEvent.getParameter("bindingParams");
          tParm.filters.push(new Filter("STATUS", FilterOperator.EQ, 4));
        },

        onRebindRej: function (oEvent) {
          let tParm = oEvent.getParameter("bindingParams");
          tParm.filters.push(new Filter("STATUS", FilterOperator.EQ, 3));
        },

        onRebindApp: function (oEvent) {
          let tParm = oEvent.getParameter("bindingParams");
          tParm.filters.push(new Filter("STATUS", FilterOperator.EQ, 5));
        },

        formatDate: function (sDate) {
          if (!sDate) {
            return ""; // Handle null or undefined dates
          }
          try {
            // Parse the string into a Date object
            var oDate = new Date(sDate);
            if (isNaN(oDate)) {
              throw new Error("Invalid date format");
            }
            // Format the date to dd-MM-yyyy
            var oDateFormat = DateFormat.getDateInstance({
              pattern: "dd-MM-yyyy",
            });
            return oDateFormat.format(oDate);
          } catch (e) {
            console.error("Date formatting error:", e, "for value:", sDate);
            return sDate; // Fallback to original value for debugging
          }
        },
      }
    );
  }
);
