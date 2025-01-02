import { useState, useEffect } from "react";
import UserTable from "./UserTable";
import NewUserModal from "./NewUserModal";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const HomePage = () => {
  const [accounts, setAccounts] = useState([]);
  const [showVerified, setShowVerified] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false); // For the "Generate Unique IDs" modal
  const [count, setCount] = useState(""); // For storing the user input for the count of unique IDs

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("http://localhost:5000/accounts");
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const toggleVerified = () => {
    setShowVerified(!showVerified);
  };

  const handleGenerate = async () => {
    if (!count || isNaN(count) || count <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    try {
      const existingIDs = new Set(accounts.map((account) => account.unique_id));
      const generatedIDs = [];

      for (let i = 0; i < Number(count); i++) {
        let newID;
        do {
          newID = `UID-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        } while (existingIDs.has(newID));
        existingIDs.add(newID);

        generatedIDs.push({
          unique_id: newID,
          name: "",
          email: "",
          mobile: "",
          fest_name: "",
          event: "",
          certification_type: "",
          achievement_level: "",
          date_of_issue: "",
          validation_status: false,
          date_of_validation: "",
        });
      }

      const confirmDownload = window.confirm(`Are you sure you want to generate ${count} QR codes and download the PDF?`);
      if (confirmDownload) {
        for (const entry of generatedIDs) {
          await fetch("http://localhost:5000/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          });
        }

        setAccounts((prevAccounts) => [...prevAccounts, ...generatedIDs]);
        alert(`${count} unique IDs generated successfully!`);
        generateQRCodePDF(generatedIDs);
        setShowGenerateModal(false); // Close the modal after completion
      }
    } catch (error) {
      console.error("Error generating unique IDs:", error);
    }
  };

 const generateQRCodePDF = async (generatedIDs) => {
  const doc = new jsPDF();

  // Add a professional header with CEG Tech Forum branding
  const addHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CEG Tech Forum - Generated QR Codes", 105, 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Date: " + new Date().toLocaleDateString(), 200, 15, { align: "right" });

    // Add the CEG Tech Forum logo (use your logo URL or base64 data here)
   
    doc.setLineWidth(0.5);
    doc.line(10, 20, 200, 20); // Horizontal line
  };

  // Add a footer with page number and CEG Tech Forum info
  const addFooter = (pageNumber) => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Page ${pageNumber}`, 105, 290, { align: "center" });

    doc.setFontSize(8);
    doc.text("CEG Tech Forum | College of Engineering, Guindy", 105, 295, { align: "center" });
  };

  // Generate QR codes with a styled layout
  const entriesPerPage = 5; // Number of entries per page
  let pageNumber = 1;

  addHeader(); // Add header for the first page

  for (let i = 0; i < generatedIDs.length; i++) {
    const entry = generatedIDs[i];

    // Add new page if necessary
    if (i > 0 && i % entriesPerPage === 0) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      addHeader();
    }

    // Generate QR code
    const qrPromise = new Promise((resolve, reject) => {
      QRCode.toDataURL(entry.unique_id, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });

    const qrCodeURL = await qrPromise;

    // Calculate row position
    const yPosition = 30 + (i % entriesPerPage) * 50;

    // Add border box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(10, yPosition - 10, 190, 40); // Rectangular box around each entry

    // Add QR Code
    doc.addImage(qrCodeURL, "PNG", 15, yPosition, 30, 30);

    // Add unique ID text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Unique ID: ${entry.unique_id}`, 50, yPosition + 15);

    // Optional: Add additional metadata if required
    if (entry.metadata) {
      doc.setFontSize(10);
      doc.text(`Metadata: ${entry.metadata}`, 50, yPosition + 25);
    }
  }

  addFooter(pageNumber); // Add footer for the last page

  // Save the PDF
  doc.save("CTF_Certification_IDs.pdf");
};

  

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-gray-900/10 shadow-xl rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-green-400 tracking-wider text-center sm:text-left">
            Event Accounts
          </h2>
          <button
            onClick={toggleVerified}
            className={`px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transform hover:scale-105 transition-all shadow-lg ${
              showVerified ? "shadow-green-500/50" : " bg-red-500 shadow-red-500/50 hover:bg-red-500 transform hover:scale-105 transition-all shadow-lg"
            }`}
          >
            {showVerified ? "Show Not Validated" : "Show Validated"}
          </button>
        </div>

        <div className="flex justify-center sm:justify-start gap-4 mb-6">
          <button
            className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transform hover:scale-105 transition-all shadow-lg shadow-green-500/50"
            onClick={() => setShowModal(true)}
          >
            Add User
          </button>
          <button
            className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transform hover:scale-105 transition-all shadow-lg shadow-green-500/50"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate Unique IDs
          </button>
        </div>

        {showModal && <NewUserModal isOpen={showModal} closeModal={() => setShowModal(false)} />}

        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-950 rounded-lg shadow-lg p-6 w-96">
              <h3 className="text-lg font-bold mb-4 text-green-400">Generate Unique IDs</h3>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg mb-4 bg-gray-800"
                placeholder="Enter number of IDs to generate"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2bg-black/30 backdrop-blur-sm border border-green-500/30 text-green-400 font-medium hover:border-green-500/50 rounded-lg "
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        <UserTable accounts={accounts} showVerified={showVerified} />
      </div>
    </div>
  );
};

export default HomePage;
