export const honData = {
    "hon_install_directory": {
        label: "HoN Install Directory",
        tooltip: "Path to your Heroes of Newerth installation directory",
        type: "input",
        section: "Basic Settings"
    },
    "hon_home_directory": {
        label: "HoN Home Directory",
        tooltip: "Path to your Heroes of Newerth replays and game logs directory",
        type: "input",
        section: "Basic Settings"
    },
    "svr_masterServer": {
        label: "Master Server",
        tooltip: "Select the master server to connect to",
        type: "select",
        options: ["api.kongor.online"],
        section: "Basic Settings"
    },
    "svr_name": {
        label: "Server Name",
        tooltip: "Enter the name of your server. This is how it appears ingame.",
        type: "input",
        section: "Basic Settings"
    },
    "svr_login": {
        label: "HoN Login",
        tooltip: "Enter your HoN username. This MUST be unique per server. Used to authenticate to game services.",
        type: "input",
        section: "Basic Settings"
    },
    "svr_password": {
        label: "HoN Password",
        tooltip: "Enter HoN password password. Used to authenticate to game services.",
        type: "password",
        section: "Basic Settings"
    },
    "svr_location": {
        label: "Server Location",
        tooltip: "Select the server location (which region is the server in?)",
        type: "select",
        options: ["AU", "BR", "EU", "RU", "SEA", "TH", "USE", "USW", "NEWERTH"],
        section: "Basic Settings"
    },
    "man_use_cowmaster": {
        label: "Server Pre-Caching (recommended)",
        tooltip: "This significantly reduces the RAM usage on Linux.",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_priority": {
        label: "Server Priority",
        tooltip: "Select the server priority",
        type: "select",
        options: ["HIGH", "REALTIME"],
        section: "Advanced Settings"
    },
    "svr_total_per_core": {
        label: "Total Per Logical Core",
        tooltip: "Select the total number of servers per logical core",
        type: "select",
        options: [0.5, 1, 2, 3],
        section: "Advanced Settings"
    },
    "svr_max_start_at_once": {
        label: "Max Servers Start at Once",
        tooltip: "Maximum number of servers to start at once. This will \"stagger start\". The less servers that start at a time, the less disruption to other running games.",
        type: "int",
        section: "Advanced Settings"
    },
    "svr_restart_between_games": {
        label: "Reset Server Instance Between Games",
        tooltip: "This is recommended when 'Server Pre-Caching' is enabled. Causes each HoN server instance to reset after a completed game.",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_enableProxy": {
        label: "Enable Proxy",
        tooltip: "Enable or disable the proxy",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "man_enableProxy": {
        label: "Enable Proxy",
        tooltip: "Enable or disable the proxy",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_noConsole": {
        label: "No Console",
        tooltip: "Run with no console windows. This improves performance, as there are less moving windows.",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_enableBotMatch": {
        label: "Allow Botmatch",
        tooltip: "This setting will allow botmatches on your server. Otherwise the server is terminated for botmatch.",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_start_on_launch": {
        label: "Start Servers on HoNfigurator Startup",
        tooltip: "Controls whether the servers should startup when HoNfigurator starts up",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_override_affinity": {
        label: "Override Server Affinity",
        tooltip: "IMPORTANT: Unless you have identified issues with affinity, do not enable this setting.",
        type: "checkbox",
        section: "Advanced Settings"
    },
    "svr_starting_gamePort": {
        label: "Starting Game Port",
        tooltip: "Starting port number for game connections. This is the local port value. If your servers are protected by the proxy, the real public port value will be displayed to the right.",
        type: "int",
        section: "Advanced Settings"
    },
    "svr_starting_voicePort": {
        label: "Starting Voice Port",
        tooltip: "Starting port number for voice connections. This is the local port value. If your servers are protected by the proxy, the real public port value will be displayed to the right.",
        type: "int",
        section: "Advanced Settings"
    },
    // Add more hon_data keys here...
};
// Define friendly labels and tooltips for application_data
export const applicationData = {
    // Add your application_data keys and their friendly labels here
    "timers.manager.public_ip_healthcheck": {
        label: "Public IP HealthCheck",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.manager.general_healthcheck": {
        label: "General Health Check",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.manager.lag_healthcheck": {
        label: "Lag Health Check",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.manager.check_for_hon_update": {
        label: "Check for HoN Update",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.manager.check_for_honfigurator_update": {
        label: "Check for HoNfigurator Update",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.manager.resubmit_match_stats": {
        label: "Resubmit Failed Match Stats",
        tooltip: "",
        type: "int",
        section: "Health Check Intervals",
        max: 10000,
        suffix: "seconds"
    },
    "timers.replay_cleaner.active": {
        label: "Replay Cleaning",
        tooltip: "",
        type: "checkbox",
        section: "Schedule Tasks",
        max: 10000
    },
    "timers.replay_cleaner.max_replay_age_days": {
        label: "Max Replay Age",
        tooltip: "Removes replays older than X days. If this value is 0, no cleanup occurs.",
        type: "int",
        section: "Schedule Tasks",
        max: 90,
        dependant_on: "timers.replay_cleaner.active",
        suffix: "days"
    },
    "timers.replay_cleaner.max_temp_files_age_days": {
        label: "Max Temp Files Age",
        tooltip: "If this value is 0, no cleanup occurs.",
        type: "int",
        section: "Schedule Tasks",
        max: 90,
        dependant_on: "timers.replay_cleaner.active",
        suffix: "days"
    },
    "timers.replay_cleaner.max_temp_folders_age_days": {
        label: "Max Temp Folders Age",
        tooltip: "If this value is 0, no cleanup occurs.",
        type: "int",
        section: "Schedule Tasks",
        max: 90,
        dependant_on: "timers.replay_cleaner.active",
        suffix: "days"
    },
    "timers.replay_cleaner.max_clog_age_days": {
        label: "Max HoN Logfile Age",
        tooltip: "If this value is 0, no cleanup occurs.",
        type: "int",
        section: "Schedule Tasks",
        max: 90,
        dependant_on: "timers.replay_cleaner.active",
        suffix: "days"
    },
    "longterm_storage.active": {
        label: "Replay Longterm Storage",
        tooltip: "Enable longterm storage of replays. This is to save space on your fast disk.",
        type: "checkbox",
        section: "Schedule Tasks",
    },
    "longterm_storage.location": {
        label: "Location",
        tooltip: "This is a longterm storage location. Replays will be moved here daily. They will still be available in-game.",
        type: "path",
        section: "Schedule Tasks",
        dependant_on: "longterm_storage.active"
    },
    "timers.replay_cleaner.scheduled_time": {
        label: "Scheduled Daily Cleanup",
        tooltip: "This is the local time on your server. You should pick a time that is not in peak hour.",
        type: "time",
        section: "Schedule Tasks"
    },
};