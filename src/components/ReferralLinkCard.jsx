import React, { useEffect, useState, useContext, useRef } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";
import { AuthContext } from "../context/AuthContext";

const ReferralLinkCard = () => {
  const { user, loading } = useContext(AuthContext);
  const [referralCode, setReferralCode] = useState("");
  const [fetching, setFetching] = useState(false);
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!loading && user) {
      setFetching(true);
      const db = getFirestore(app);
      getDoc(doc(db, "users", user.uid))
        .then((userDoc) => {
          if (!isMounted) return;
          if (userDoc.exists()) {
            const data = userDoc.data();
            setReferralCode(data.userId || user.uid);
          } else {
            setReferralCode(user.uid);
          }
          setFetching(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setReferralCode(user.uid);
          setFetching(false);
        });
    } else {
      setReferralCode("");
      setFetching(false);
    }
    return () => { isMounted = false; };
  }, [user, loading]);

  let inputValue = "";
  let inputPlaceholder = "";
  if (loading || fetching) {
    inputValue = "";
    inputPlaceholder = "Loading...";
  } else if (!user) {
    inputValue = "";
    inputPlaceholder = "Please log in to see your referral link";
  } else if (referralCode) {
    inputValue = `${window.location.origin}/register?ref=${referralCode}`;
    inputPlaceholder = "";
  }

  const handleCopy = () => {
    if (!inputValue) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inputValue).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    } else if (inputRef.current) {
      inputRef.current.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="referral-link-card">
      <h3>Your Referral Link</h3>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        placeholder={inputPlaceholder}
        readOnly
        style={{ width: "100%" }}
      />
      <button
        onClick={handleCopy}
        disabled={!inputValue}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

export default ReferralLinkCard;
