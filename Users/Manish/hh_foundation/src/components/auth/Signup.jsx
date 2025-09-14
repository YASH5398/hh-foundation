// ... existing code ...
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
// ... existing code ...
function Signup() {
  const [searchParams] = useSearchParams();
  const [ref, setRef] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [sponsorError, setSponsorError] = useState(null);
  const [sponsorName, setSponsorName] = useState(null);

  useEffect(() => {
    const sponsorId = searchParams.get("ref");
    console.log("ref param:", sponsorId);

    const verifySponsor = async (id) => {
      setIsVerifying(true);
      setSponsorError(null);
      setSponsorName(null);
      try {
        // Simulate API call for sponsor verification
        // Replace with actual API call to verify sponsor ID
        const response = await new Promise(resolve => setTimeout(() => {
          if (id === "YASH5398") {
            resolve({ success: true, name: "Yash Foundation" });
          } else if (id) {
            resolve({ success: false, message: "Invalid Sponsor ID" });
          } else {
            resolve({ success: true, name: null }); // No sponsor ID provided
          }
        }, 1000));

        if (response.success) {
          setRef(id || "");
          setSponsorName(response.name);
        } else {
          setRef("");
          setSponsorError(response.message);
        }
      } catch (err) {
        setRef("");
        setSponsorError("Error verifying sponsor.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifySponsor(sponsorId);
  }, [searchParams]);

  // Only show a brief verifying message, form should always be visible
  return (
    <div>
      <h1>Register / Signup</h1>
      <form>
        <label>Sponsor ID</label>
        <input type="text" value={ref} readOnly placeholder="No sponsor" />
        {isVerifying && <p>Verifying sponsor...</p>}
        {sponsorName && !isVerifying && <p>Sponsor: {sponsorName}</p>}
        {sponsorError && !isVerifying && <p style={{ color: 'red' }}>{sponsorError}</p>}
        {/* other registration fields */}
      </form>
    </div>
  );
}

export default Signup;