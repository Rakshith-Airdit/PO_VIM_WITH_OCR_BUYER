sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend(
    "com.povimwithocrbuyer.povimwithocrbuyer.controller.InvoiceList",
    {
      onInit() {},
      onInvoiceItemPress: function (oEvent) {
        const selectedItem = oEvent.getSource();
        const context = selectedItem.getBindingContext();
        const reqNumber = context.getProperty("REQUEST_NO");
        const status = context.getProperty("STATUS_DESC");

        this.getOwnerComponent().getRouter().navTo("RouteInvoiceDetails", {
          reqNumber,
        });
      },
      onIconTabBarSelect: function (oEvent) {
        const oIconTabBar = oEvent.getSource();
        const sSelectedKey = oIconTabBar.getSelectedKey();

        // Get the ID of the SmartTable based on the selected tab key
        let sSmartTableId;
        if (sSelectedKey.includes("idPendingInvoices")) {
          sSmartTableId = "idPendingInvoicesTable";
        } else if (sSelectedKey.includes("idApprovedInvoices")) {
          sSmartTableId = "idApprovedInvoicesTable";
        } else if (sSelectedKey.includes("idRejectedInvoices")) {
          sSmartTableId = "idRejectedInvoicesTable";
        }

        // Find the SmartTable control
        const oSmartTable = this.byId(sSmartTableId);

        // Set busy state and rebind the table
        if (oSmartTable) {
          // oSmartTable.setBusy(true);
          oSmartTable.rebindTable(true);
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
    }
  );
});
