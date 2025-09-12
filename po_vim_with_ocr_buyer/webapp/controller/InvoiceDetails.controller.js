sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    Fragment
  ) => {
    "use strict";

    return Controller.extend(
      "com.povimwithocrbuyer.povimwithocrbuyer.controller.InvoiceDetails",
      {
        onInit() {
          this.getOwnerComponent()
            .getRouter()
            .getRoute("RouteInvoiceDetails")
            .attachPatternMatched(this._onPatternMatched, this);
        },

        _initializeModels: function () {
          this.getView().setModel(
            new JSONModel({ results: [] }),
            "oHeaderModel"
          );
          this.getView().setModel(
            new JSONModel({ results: [] }),
            "oItemsModel"
          );
          this.getView().setModel(
            new JSONModel({ attachments: [] }),
            "oAttachmentsModel"
          );
        },

        _onPatternMatched: async function (oEvent) {
          const reqNumber = oEvent.getParameter("arguments").reqNumber;

          if (!reqNumber) {
            MessageBox.error("Request Number Not Found!!. Please try again.");
            return;
          }

          this.reqNumber = reqNumber;

          this.getView().setBusy(true);

          try {
            this._initializeModels();
            await this._loadData(reqNumber);
          } catch (oError) {
            MessageBox.error(`Failed to load data: ${oError.message}`);
          } finally {
            this.getView().setBusy(false);
          }
        },

        _loadData: async function (reqNumber) {
          const oHeaderModel = this.getView().getModel("oHeaderModel");
          const oItemsModel = this.getView().getModel("oItemsModel");
          const oAttachmentsModel =
            this.getView().getModel("oAttachmentsModel");

          let aFilters = [
            new Filter("REQUEST_NO", FilterOperator.EQ, reqNumber),
          ];

          await Promise.all([
            this._loadEntity("/VIM_PO_OCR_HEAD", aFilters, "oHeaderModel"),
          ]);

          const oHeaderData = oHeaderModel.getProperty("/results/0");
          // const oItemsData = oItemsModel.getProperty("/results");
          const oItemsData = oHeaderData?.TO_VIM_PO_OCR_ITEM?.results || [];
          const oAttachmentsData = oHeaderData?.ATTACHMENTS?.results || [];

          debugger;
          console.log(oHeaderData, oItemsData, oAttachmentsData);

          oItemsModel.setProperty("/results", oItemsData);
          oAttachmentsModel.setProperty("/attachments", oAttachmentsData);

          console.log("Models Data Set");
        },

        _loadEntity: function (sPath, aFilters, sModelName) {
          return new Promise((resolve, reject) => {
            this.getView()
              .getModel()
              .read(sPath, {
                filters: aFilters,
                success: (oData) => {
                  this.getView()
                    .getModel(sModelName)
                    .setProperty("/results", oData.results || []);
                  resolve();
                },
                error: reject,
              });
          });
        },

        onPressApprove: function () {
          // if (!this._validateForm()) return;

          if (!this._pApproveCommentDialog) {
            this._pApproveCommentDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.povimwithocrbuyer.povimwithocrbuyer.fragments.ApproveComment",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }

          this._pApproveCommentDialog.then(
            function (oDialog) {
              this.byId("approveCommentTextArea").setValue("");
              this.byId("approveCharCounter").setText("0 / 500");
              oDialog.open();
            }.bind(this)
          );
        },

        onApproveCommentLiveChange: function (oEvent) {
          const sValue = oEvent.getParameter("value") || "";
          this.byId("approveCharCounter").setText(`${sValue.length} / 500`);
        },

        onApproveCommentCancel: function () {
          this.byId("approveCommentDialog").close();
        },

        onApproveCommentSubmit: function () {
          var sComment = this.byId("approveCommentTextArea").getValue().trim();

          if (!sComment) {
            MessageBox.warning("Approval comment is required.");
            return;
          }

          this.byId("approveCommentDialog").close();
          this._submitAction("APPROVE", sComment);
        },

        onPressReject: function () {
          // if (!this._validateForm()) return;

          if (!this._oRejectDialog) {
            this._oRejectDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.povimwithocrbuyer.povimwithocrbuyer.fragments.RejectionDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }

          this._oRejectDialog.then(
            function (oDialog) {
              oDialog.open();
            }.bind(this)
          );
        },

        onRejectDialogClose: function () {
          let rejectionCommentElement = this.getView().byId("rejectionComment");
          if (this._oRejectDialog) {
            this._oRejectDialog.then(function (oDialog) {
              rejectionCommentElement.setValue("");
              oDialog.close();
            });
          }
        },

        onConfirmReject: function () {
          var sComment = this.byId("rejectionComment").getValue().trim();

          if (!sComment) {
            MessageBox.warning("Please enter a rejection comment.");
            return;
          }

          // Close the dialog before proceeding
          if (this._oRejectDialog) {
            this._oRejectDialog.then(
              function (oDialog) {
                oDialog.close();
              }.bind(this)
            );
          }

          this._submitAction("REJECT", sComment);
        },

        _submitAction: function (sAction, sComment) {
          this.getView().setBusy(true);

          const oPayload = this._preparePayload(sAction, sComment);
          const oModel = this.getView().getModel();

          oModel.create("/PostPOVimDatawithOCR", oPayload, {
            method: "POST",
            success: (oRes) => {
              console.log(oRes);
              MessageBox.success("Data Posted Successfully!!.", {
                title: "Success",
                actions: [MessageBox.Action.OK],
                onClose: (sAction) => {
                  console.log("MessageBox closed with action:", sAction);
                  if (sAction === MessageBox.Action.OK) {
                    this.onClosePdf();
                    const oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteInvoiceList");
                  }
                },
              });
            },
            error: (oErr) => {
              console.error(oErr);
              MessageBox.error(
                "Something went wrong while submitting the data!!.",
                {
                  title: "Error",
                  actions: [MessageBox.Action.OK],
                  onClose: (sAction) => {
                    console.log("MessageBox closed with action:", sAction);
                    if (sAction === MessageBox.Action.OK) {
                      this.onClosePdf();
                      const oRouter = this.getOwnerComponent().getRouter();
                      oRouter.navTo("RouteInvoiceList");
                    }
                  },
                }
              );
            },
          });
        },

        _preparePayload: function (sAction, sComment) {
          var oView = this.getView();
          var oHeadModel = oView.getModel("oHeaderModel");
          var oItemsModel = oView.getModel("oItemsModel");
          var oAttachmentModel = oView.getModel("oAttachmentsModel");

          debugger;
          const {
            REQUEST_NO,
            SUPPLIER_NUMBER,
            COMPANY_CODE,
            SUPPLIER,
            INVOICE_NO,
            INVOICE_DATE,
            PO_NUMBER,
            INVOICE_AMOUNT,
            VENDOR_ADDRESS,
            BANK_ACCOUNT_NO,
            BANK_NAME,
            PURCHASE_ORG,
            PURCHASE_GROUP,
            CURRENCY,
            DOWNPAYMENT_AMOUNT,
            DOWNPAYMENT_PERCENTAGE,
            DOWNPAYMENT_DUE_DATE,
          } = oHeadModel.getProperty("/results/0");

          return {
            action: sAction,
            REQUEST_NO: REQUEST_NO,
            PoVimhead: [
              {
                SUPPLIER_NUMBER: SUPPLIER_NUMBER || "",
                COMPANY_CODE: COMPANY_CODE || "",
                SUPPLIER: SUPPLIER || "",
                INVOICE_NO: INVOICE_NO || "",
                INVOICE_DATE: INVOICE_DATE || "",
                PO_NUMBER: PO_NUMBER || "",
                INVOICE_AMOUNT: INVOICE_AMOUNT || "",
                APPROVED_COMMENT: sComment || "",
                VENDOR_ADDRESS: VENDOR_ADDRESS || "",
                BANK_ACCOUNT_NO: BANK_ACCOUNT_NO || "",
                BANK_NAME: BANK_NAME || "",
                PURCHASE_ORG: PURCHASE_ORG || "",
                PURCHASE_GROUP: PURCHASE_GROUP || "",
                CURRENCY: CURRENCY || "",
                DOWNPAYMENT_AMOUNT: DOWNPAYMENT_AMOUNT || "",
                DOWNPAYMENT_PERCENTAGE: DOWNPAYMENT_PERCENTAGE || "",
                DOWNPAYMENT_DUE_DATE: DOWNPAYMENT_DUE_DATE || "",
              },
            ],
            PoVimitem:
              this._cleanItems(oItemsModel.getProperty("/results")) || [],
            Attachment:
              this._cleanItems(oAttachmentModel.getProperty("/attachments")) ||
              [],
          };
        },

        _cleanItems: function (aItems) {
          const excludedProps = new Set([
            "__metadata",
            "_id",
            "ATTACHMENT_ID",
            "REQUEST_NO",
            "STATUS",
          ]);

          return (aItems || []).map((item) => {
            const cleanedItem = {};
            for (const [key, value] of Object.entries(item)) {
              if (!excludedProps.has(key)) {
                cleanedItem[key] = value;
              }
            }
            return cleanedItem;
          });
        },

        onPreviewPdf: function (oEvent) {
          debugger;
          const oView = this.getView();
          const sUrl = oEvent.getSource().data("imageUrl");

          if (!sUrl) {
            MessageToast.show("No PDF URL available");
            return;
          }
          // debugger;

          document.getElementById("pdfFrame").src = sUrl;

          // Resize panels
          oView.byId("splitterSize").setSize("65%");
          oView.getModel().setProperty("/isPdfVisible", true);
        },

        onClosePdf: function () {
          const oView = this.getView();
          // Resize the splitter to hide the PDF view and show only the ObjectPage
          oView.byId("splitterSize").setSize("100%");
          // Clear the iframe source to stop playback/display
          document.getElementById("pdfFrame").src = "";
          // Set the model property to false to hide the close button
          oView.getModel().setProperty("/isPdfVisible", false);
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

        handleClose: function () {
          this.onClosePdf();
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("RouteInvoiceList");
        },

        onExit: function () {
          this.onClosePdf();
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("RouteInvoiceList");
        },
      }
    );
  }
);
