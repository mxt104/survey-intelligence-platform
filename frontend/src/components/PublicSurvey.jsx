import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useParams } from "react-router-dom";

export default function PublicSurvey() {

    const { token } = useParams();
    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        loadSurvey();
    }, []);

    const loadSurvey = async () => {
        try {
            const data = await api.getPublicSurvey(token);
            setSurvey(data);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAnswer = (questionId, value) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const handleSubmit = async () => {
        try {
            const payload = Object.entries(answers).map(
                ([questionId, answer]) => ({
                    question_id: Number(questionId),
                    answer_text: String(answer)
                })
            );

            await api.submitPublicResponse(token, payload);
            setSubmitted(true);

        } catch (err) {
            alert(err.message);
        }
    };

    if (submitted) {
        return (
            <div style={{ padding: 40 }}>
                <h2>Thank You</h2>
                <p>Your response has been submitted.</p>
            </div>
        );
    }

    if (!survey) {
        return <div style={{ padding: 40 }}>Loading...</div>;
    }

    const renderInput = (q) => {
        const value = answers[q.id] ?? "";

        if (q.type === "MCQ") {
            let options = [];
            try {
                options = q.options ? JSON.parse(q.options) : [];
            } catch {
                options = [];
            }
            return (
                <div style={{ marginTop: 10 }}>
                    {options.map((opt) => (
                        <label key={opt} style={{ display: "block", marginBottom: 6 }}>
                            <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={value === opt}
                                onChange={() => handleAnswer(q.id, opt)}
                                style={{ marginRight: 8 }}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            );
        }

        if (q.type === "Rating") {
            return (
                <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} style={{ textAlign: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={n}
                                checked={Number(value) === n}
                                onChange={() => handleAnswer(q.id, n)}
                                style={{ display: "block", margin: "0 auto 4px" }}
                            />
                            {n}
                        </label>
                    ))}
                </div>
            );
        }

        if (q.type === "NPS") {
            return (
                <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <label key={n} style={{ textAlign: "center", cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name={`q_${q.id}`}
                                    value={n}
                                    checked={Number(value) === n}
                                    onChange={() => handleAnswer(q.id, n)}
                                    style={{ display: "block", margin: "0 auto 4px" }}
                                />
                                {n}
                            </label>
                        ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginTop: 4 }}>
                        <span>Not likely</span>
                        <span>Very likely</span>
                    </div>
                </div>
            );
        }

        // Default: Text
        return (
            <textarea
                style={{
                    width: "100%",
                    marginTop: 10,
                    minHeight: 80,
                    boxSizing: "border-box"
                }}
                value={value}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
            />
        );
    };

    return (
        <div style={{ maxWidth: 800, margin: "40px auto" }}>
            <h1>{survey.title}</h1>
            <p>{survey.description}</p>

            {survey.questions.map(q => (
                <div
                    key={q.id}
                    style={{
                        marginBottom: 20,
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 10
                    }}
                >
                    <label>
                        <strong>{q.question_text}</strong>
                    </label>
                    {renderInput(q)}
                </div>
            ))}

            <button onClick={handleSubmit}>
                Submit Survey
            </button>
        </div>
    );
}
