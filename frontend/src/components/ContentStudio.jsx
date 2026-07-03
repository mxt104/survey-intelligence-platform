import React from "react";

export default function ContentStudio() {
    const opportunities = [
        {
            insight: "42% of engineers struggle selecting flow sensors",
            linkedin: "3 Mistakes Engineers Make When Choosing Flow Sensors",
            youtube: "How to Select the Right Flow Sensor",
            instagram: "5 Things To Know Before Buying a Flow Sensor",
            blog: "Complete Flow Sensor Selection Guide"
        },
        {
            insight: "Customers want simpler MFC integration",
            linkedin: "Why Mass Flow Controller Integration Fails",
            youtube: "Mass Flow Controller Setup Explained",
            instagram: "Common MFC Installation Errors",
            blog: "Mass Flow Controller Integration Best Practices"
        }
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h2>Content Studio</h2>
                    <p>
                        Convert customer insights into LinkedIn, YouTube, Instagram and Blog content.
                    </p>
                </div>
            </div>

            {opportunities.map((item, index) => (
                <div key={index} className="card" style={{ marginBottom: "24px" }}>
                    <h3>{item.insight}</h3>

                    <div className="grid-2" style={{ marginTop: "16px" }}>
                        <div className="mini-card">
                            <h4>LinkedIn</h4>
                            <p>{item.linkedin}</p>
                        </div>

                        <div className="mini-card">
                            <h4>YouTube</h4>
                            <p>{item.youtube}</p>
                        </div>

                        <div className="mini-card">
                            <h4>Instagram</h4>
                            <p>{item.instagram}</p>
                        </div>

                        <div className="mini-card">
                            <h4>Blog</h4>
                            <p>{item.blog}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}