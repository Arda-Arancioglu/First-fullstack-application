// src/QuestionForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import './QuestionFormStyle.css';

const QuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
 const [status, setStatus]       = useState(null);         // null | "saving" | "success" | "error"
 const [savedData, setSavedData] = useState(null);         // store server response

  useEffect(() => {
    axios
      .get("http://localhost:8080/questions")
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("saving");

    const payload = Object.entries(answers).map(([id, resp]) => ({
      question: { id: +id },
      response: resp,
    }));

    axios
      .post("http://localhost:8080/answers", payload)
      .then((res) => {
       setSavedData(res.data);
        setStatus("success");
      })
      .catch((err) => {
        console.error("Save failed:", err);
        setStatus("error");
      });
  };

  return (
    <div class="div-wrapping-container">
      <h1>Form</h1>
      <form class="form-class" onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div key={q.id} style={{ marginBottom: "1rem" }}>
            <label>{q.questionText}</label>
            <br />
            <input
              type={q.type === "radio" ? "text" : q.type}
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          </div>
        ))}

        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Submit"}
        </button>
      </form>

     
     {status === "success" && (
       <div style={{ marginTop: 20, color: "green" }}>
         ✅ Your answers were saved!
         <pre>{JSON.stringify(savedData, null, 2)}</pre>
       </div>
     )}
     {status === "error" && (
       <div style={{ marginTop: 20, color: "red" }}>
         ❌ Oops! Something went wrong.
       </div>
     )}
    </div>
  );
};

export default QuestionForm;
