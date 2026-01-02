const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transformer Management API',
      version: '1.0.0',
      description: 'API documentation for the Transformer Management System',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            loginId: {
              type: 'string',
            },
            role: {
              type: 'string',
            },
            pages: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        Transformer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            serialNo: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'DAMAGED', 'REPAIRED'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ChalanDescription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            description: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Consignee: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            gstNo: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DamagedTransformer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            serialNo: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Defferment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DeliveryChallan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            finalInspectionId: {
              type: 'string',
            },
            challanNo: {
              type: 'string',
            },
            subSerialFrom: {
              type: 'string',
              nullable: true,
            },
            subSerialTo: {
              type: 'string',
              nullable: true,
            },
            consignorName: {
              type: 'string',
            },
            consignorAddress: {
              type: 'string',
            },
            consignorPhone: {
              type: 'string',
            },
            consignorGST: {
              type: 'string',
            },
            consignorEmail: {
              type: 'string',
            },
            consigneeId: {
              type: 'string',
            },
            driverName: {
              type: 'string',
            },
            lorryNo: {
              type: 'string',
            },
            challanDescription: {
              type: 'string',
            },
            materialDescription: {
              type: 'string',
            },
            challanCreatedAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DeliveryDetail: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DeliverySchedule: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            tnNumber: {
              type: 'string',
            },
            rating: {
              type: 'integer',
            },
            wound: {
              type: 'string',
            },
            phase: {
              type: 'string',
            },
            loa: {
              type: 'string',
            },
            loaDate: {
              type: 'string',
              format: 'date-time',
            },
            po: {
              type: 'string',
            },
            poDate: {
              type: 'string',
              format: 'date-time',
            },
            commencementDays: {
              type: 'integer',
            },
            commencementDate: {
              type: 'string',
              format: 'date-time',
            },
            deliveryScheduleDate: {
              type: 'string',
              format: 'date-time',
            },
            imposedLetters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  imposedLetterNo: {
                    type: 'string',
                  },
                  date: {
                    type: 'string',
                  },
                },
              },
            },
            liftingLetters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  liftingLetterNo: {
                    type: 'string',
                  },
                  date: {
                    type: 'string',
                  },
                },
              },
            },
            guaranteePeriodMonths: {
              type: 'integer',
            },
            totalQuantity: {
              type: 'integer',
            },
            chalanDescription: {
              type: 'string',
            },
            deliverySchedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  start: {
                    type: 'string',
                  },
                  end: {
                    type: 'string',
                  },
                  quantity: {
                    type: 'string',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FailureAnalysis: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            sinNo: {
              type: 'string',
            },
            acosName: {
              type: 'string',
            },
            trfSiNo: {
              type: 'string',
            },
            rating: {
              type: 'string',
            },
            wound: {
              type: 'string',
            },
            phase: {
              type: 'string',
            },
            tnNumber: {
              type: 'string',
            },
            subDivision: {
              type: 'string',
            },
            locationOfFailure: {
              type: 'string',
            },
            dateOfSupply: {
              type: 'string',
              format: 'date-time',
            },
            dateOfExpiry: {
              type: 'string',
              format: 'date-time',
            },
            reasonOfFailure: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FinalInspection: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            deliveryScheduleId: {
              type: 'string',
            },
            serialNumberFrom: {
              type: 'integer',
            },
            serialNumberTo: {
              type: 'integer',
            },
            offerDate: {
              type: 'string',
              format: 'date-time',
            },
            offeredQuantity: {
              type: 'integer',
            },
            inspectionDate: {
              type: 'string',
              format: 'date-time',
            },
            inspectedQuantity: {
              type: 'integer',
            },
            inspectionOfficers: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            diNo: {
              type: 'string',
            },
            diDate: {
              type: 'string',
              format: 'date-time',
            },
            warranty: {
              type: 'string',
            },
            consignees: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  consigneeId: {
                    type: 'string',
                  },
                  quantity: {
                    type: 'integer',
                  },
                  subSerialNumber: {
                    type: 'string',
                  },
                },
              },
            },
            sealingDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trfSiNo: {
                    type: 'string',
                  },
                  polySealNo: {
                    type: 'string',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GPFailure: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            deliveryChallanId: {
              type: 'string',
            },
            trfsiNo: {
              type: 'string',
            },
            rating: {
              type: 'string',
            },
            subDivision: {
              type: 'string',
            },
            failureDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  failureDate: {
                    type: 'string',
                  },
                  informationDate: {
                    type: 'string',
                  },
                  place: {
                    type: 'string',
                  },
                },
              },
            },
            guaranteeExpiry: {
              type: 'string',
              format: 'date-time',
            },
            guaranteeStatus: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GPReceiptNote: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            accountReceiptNoteNo: {
              type: 'string',
            },
            accountReceiptNoteDate: {
              type: 'string',
              format: 'date-time',
            },
            sinNo: {
              type: 'string',
            },
            consigneeName: {
              type: 'string',
            },
            discomReceiptNoteNo: {
              type: 'string',
            },
            discomReceiptNoteDate: {
              type: 'string',
              format: 'date-time',
            },
            remarks: {
              type: 'string',
              nullable: true,
            },
            trfsiNo: {
              type: 'string',
            },
            rating: {
              type: 'string',
            },
            challanNo: {
              type: 'string',
            },
            sealNoTimeOfGPReceived: {
              type: 'string',
            },
            consigneeTFRSerialNo: {
              type: 'string',
            },
            oilLevel: {
              type: 'string',
            },
            hvBushing: {
              type: 'string',
            },
            lvBushing: {
              type: 'string',
            },
            htMetalParts: {
              type: 'string',
            },
            ltMetalParts: {
              type: 'string',
            },
            mAndpBox: {
              type: 'string',
            },
            mAndpBoxCover: {
              type: 'string',
            },
            mccb: {
              type: 'string',
            },
            icb: {
              type: 'string',
            },
            copperFlexibleCable: {
              type: 'string',
            },
            alWire: {
              type: 'string',
            },
            conservator: {
              type: 'string',
            },
            radiator: {
              type: 'string',
            },
            fuse: {
              type: 'string',
            },
            channel: {
              type: 'string',
            },
            core: {
              type: 'string',
            },
            polySealNo: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LOA: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            tnDetail: {
              type: 'string',
            },
            loa: {
              type: 'string',
            },
            po: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MaterialDescription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            description: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MaterialOfferedButNominationPending: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NominationDone: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        InspectionDone: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DIReceived: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProductionPlanning: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NewGPTransformer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NewGPSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        SupplyGPExpiredStatement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GPExtendedWarrantyInformation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
