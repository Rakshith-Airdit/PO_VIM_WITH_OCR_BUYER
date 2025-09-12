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

      formatStatusState: function (sStatus) {
        // Check if sStatus is null or undefined
        if (!sStatus) {
          return "None"; // or any other default state like "Indication05"
        }

        // Now, perform the status check
        if (sStatus.includes("In-Process")) {
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
