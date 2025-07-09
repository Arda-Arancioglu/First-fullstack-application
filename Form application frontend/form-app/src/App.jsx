// src/App.jsx
import React, { useState } from "react";
import LandingP     from "./LandingPage/LandingP";
import QuestionForm from "./components/QuestionForm";

export default function App() {
  // false = show login; true = show form
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <QuestionForm />
  ) : (
    // pass a function so LandingP can tell us when to switch
    <LandingP onLogin={() => setIsLoggedIn(true)} />
  );
}
