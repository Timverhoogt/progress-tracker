(function (global) {
    const competencyRoles = {
        "CS Officer": [
            { name: "Flexibility", suggestedCategory: "continuous_improvement" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "CS&P Representative": [
            { name: "Flexibility", suggestedCategory: "continuous_improvement" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Specialist Douane": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Douane declarant": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "AP Coordinator": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Working efficiently", suggestedCategory: "continuous_improvement" },
            { name: "Flexibility", suggestedCategory: "continuous_improvement" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "RTR Accounting Specialist": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Integrity", suggestedCategory: "leadership" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Office Manager": [
            { name: "Initiative", suggestedCategory: "leadership" },
            { name: "Integrity", suggestedCategory: "leadership" },
            { name: "Organizational awareness", suggestedCategory: "leadership" },
            { name: "Professional representation", suggestedCategory: "communication" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "HR Officer": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Integrity", suggestedCategory: "leadership" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "HR Advisor": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Integrity", suggestedCategory: "leadership" },
            { name: "Organizational awareness", suggestedCategory: "leadership" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Medewerker HSSE (brand, BHV / opleidingen procesveiligheid, Atex)": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Organizational awareness", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "HSSEQ Advisor": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Organizational awareness", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Compliance Coordinator Milieu en Kwaliteit": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Organizational awareness", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Systeembeheerder": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Leerling Operator": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Commitment and engagement", suggestedCategory: "continuous_improvement" },
            { name: "Active listening", suggestedCategory: "communication" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Operator Continue": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Admo / Admo plus": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Working efficiently", suggestedCategory: "continuous_improvement" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Allround Operator": [
            { name: "Coaching", suggestedCategory: "leadership" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Assistent Wachtchef": [
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Leading (operational, task-focused)", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Decisive action", suggestedCategory: "leadership" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Wachtchef": [
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Leadership", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Assistent Manager Operations": [
            { name: "Integrity", suggestedCategory: "leadership" },
            { name: "Knowledge management", suggestedCategory: "technical" },
            { name: "Leadership", suggestedCategory: "leadership" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "2e Operator": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Commitment and engagement", suggestedCategory: "continuous_improvement" },
            { name: "Active listening", suggestedCategory: "communication" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "1e Operator": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Process Controller": [
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Leading (operational, task-focused)", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Shiftleader": [
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Leadership", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Dagdienst Permit Operator": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Teamleider Dagdienst": [
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Leadership", suggestedCategory: "leadership" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Operationele SHE Inspector": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Continuous Improvement Advisor": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Market orientation", suggestedCategory: "project_management" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Operations Engineer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Market orientation", suggestedCategory: "project_management" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Application Officer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Market orientation", suggestedCategory: "project_management" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Opleidingscoordinator": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Market orientation", suggestedCategory: "project_management" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Procurement Facility Administrator": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Stress resilience", suggestedCategory: "continuous_improvement" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Strategic Buyer": [
            { name: "Active listening", suggestedCategory: "communication" },
            { name: "Market orientation", suggestedCategory: "project_management" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Strategic and conceptual thinking", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Magazijnbeheerder / warehouse keeper": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Technical Administrator": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Document Controller": [
            { name: "Accuracy", suggestedCategory: "analytical" },
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Planning and organizing (own work)", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "E&I Tekenaar": [
            { name: "Working efficiently", suggestedCategory: "continuous_improvement" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Independence", suggestedCategory: "continuous_improvement" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Werkvoorbereider": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Constructie Supervisor": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Decisive action", suggestedCategory: "leadership" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Supervisor (M&R)": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Inspecteur tankengineer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Planning and organizing", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Supervisor Maintenance": [
            { name: "Communication (verbal expression)", suggestedCategory: "communication" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Problem-solving ability", suggestedCategory: "analytical" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Collaboration", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Maintenance Engineer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Innovation", suggestedCategory: "continuous_improvement" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Project Engineer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Innovation", suggestedCategory: "continuous_improvement" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Proces Engineer": [
            { name: "Analytical ability", suggestedCategory: "analytical" },
            { name: "Expertise and professional knowledge", suggestedCategory: "technical" },
            { name: "Innovation", suggestedCategory: "continuous_improvement" },
            { name: "Quality awareness", suggestedCategory: "technical" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Projectmanager": [
            { name: "Decisiveness", suggestedCategory: "leadership" },
            { name: "Customer focus", suggestedCategory: "communication" },
            { name: "Leading (operational, task-focused)", suggestedCategory: "leadership" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ],
        "Teamlead Maintenance": [
            { name: "Decisiveness", suggestedCategory: "leadership" },
            { name: "Leadership", suggestedCategory: "leadership" },
            { name: "Persuasion and influence", suggestedCategory: "communication" },
            { name: "Maintaining overview", suggestedCategory: "project_management" },
            { name: "Results orientation", suggestedCategory: "project_management" },
            { name: "Safety awareness", suggestedCategory: "technical" }
        ]
    };

    const library = {
        source: 'Evos Amsterdam Competency Framework',
        roles: competencyRoles
    };

    global.EvosCompetencyLibrary = library;
})(typeof window !== "undefined" ? window : this);
