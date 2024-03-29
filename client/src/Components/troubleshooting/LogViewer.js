import React, { useState, useEffect, useContext, useRef } from 'react';
import { Select, Collapse, Button, Alert } from 'antd';
import { SelectedServerContext } from '../../App';
import { createAxiosInstanceServer } from '../../Security/axiosRequestFormat';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './LogViewer.css';

const { Option } = Select;

const LogEntry = React.memo(({ logEntry, index }) => {
    const getBackgroundColor = (logEntry, index) => {
        const logLevelRegex = / - (INFO|WARNING|ERROR|EXCEPTION|FATAL|DEBUG) - /;
        const matchesLogLevel = logEntry.content.match(logLevelRegex);

        if (matchesLogLevel) {
            const logLevel = matchesLogLevel[1];
            const alpha = index % 2 === 0 ? 0.3 : 0.5;

            switch (logLevel) {
                case "INFO":
                    return `rgba(0, 128, 0, ${alpha})`;
                case "WARNING":
                    return `rgba(255, 217, 71, ${alpha})`;
                case "ERROR":
                    return `rgba(255, 102, 102, ${alpha})`;
                case "EXCEPTION":
                    return `rgba(128, 0, 128, ${alpha})`;
                case "FATAL":
                    return `rgba(0, 0, 0, ${alpha})`;
                case "DEBUG":
                    return `rgba(0, 0, 255, ${alpha})`;
                default:
                    return index % 2 === 0 ? "rgba(245, 245, 245, 0.8)" : "rgba(255, 255, 255, 0.8)";
            }
        }

        return index % 2 === 0 ? "rgba(245, 245, 245, 0.8)" : "rgba(255, 255, 255, 0.8)";
    };


    return (
        <div
            key={index}
            style={{
                backgroundColor: getBackgroundColor(logEntry, index),
                padding: "4px 8px",
                whiteSpace: "pre-wrap",
            }}
        >
            {logEntry.content}
        </div>
    );
});



const LogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogLevel, setSelectedLogLevel] = useState('ALL');
    const [selectedClass, setSelectedClass] = useState('All Components');

    const [error, setError] = useState(null); // Add this line to define the error state
    const [accessDenied, setAccessDenied] = useState(false); // Define the accessDenied state

    const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);
    // console.log(selectedServerValue);
    // console.log(selectedServerPort);
    const axiosInstanceServer = createAxiosInstanceServer(
        selectedServerValue,
        selectedServerPort
    );


    const downloadLogs = async () => {
        // const axiosInstanceServer = createAxiosInstanceServer(
        //     SelectedServerContext.selectedServerValue,
        //     SelectedServerContext.selectedServerPort
        // );
        try {
            const response = await axiosInstanceServer.get('/get_honfigurator_log_file', {
                responseType: 'json', // Set the responseType to 'json'
                headers: {
                    Accept: 'application/json', // Set the expected content type
                },
            });

            // Join the array of lines with the appropriate newline character(s) for the client's OS
            const fileContent = response.data.join('');

            // Create a temporary link element and click it to trigger the download
            const url = window.URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'honfigurator_logs.txt'); // Set the filename for the downloaded file
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading logs:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axiosInstanceServer.get('/get_honfigurator_log_entries/500');
            if (response.data && Array.isArray(response.data)) {
                const newLogs = response.data.map((line, index) => ({
                    id: `log-${index}`,
                    content: line,
                }));

                // Extract available classes from log entries
                const classes = newLogs.reduce((acc, logEntry) => {
                    const classRegex = / - (\w+)\.py:/;
                    const matchesClass = logEntry.content.match(classRegex);
                    if (matchesClass && !acc.includes(matchesClass[1])) {
                        return [...acc, matchesClass[1]];
                    }
                    return acc;
                }, []);

                setAvailableClasses(['All Components', ...classes]);
                setError(null); // Reset the error state on successful response
                setAccessDenied(false); // Reset the accessDenied state on successful response
                return newLogs;
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            if (error.response && error.response.status === 403) {
                setError('Access to the logs is forbidden.'); // Update error state with custom message
                setAccessDenied(true); // Update accessDenied state
            } else {
                setError('Error fetching logs.'); // Update error state with generic error message
            }
        } finally {
            setLoading(false);
        }
        return null;
    };

    const [logLevelCounts, setLogLevelCounts] = useState({});
    const [availableClasses, setAvailableClasses] = useState([]);

    const logsRef = useRef(logs);

    useEffect(() => {
        const countLogLevels = () => {
            const counts = {
                ALL: 0,
                INFO: 0,
                WARNING: 0,
                ERROR: 0,
                EXCEPTION: 0,
                FATAL: 0,
                DEBUG: 0,
            };

            logsRef.current.forEach((log) => {
                const logLevelRegex = / - (INFO|WARNING|ERROR|EXCEPTION|FATAL|DEBUG) - /;
                const matchesLogLevel = log.content.match(logLevelRegex);

                if (matchesLogLevel) {
                    counts[matchesLogLevel[1]] += 1;
                    counts.ALL += 1;
                }
            });

            return counts;
        };

        const updateLogs = async () => {
            if (!accessDenied) {
                const newLogs = await fetchLogs();
                if (newLogs && JSON.stringify(logsRef.current) !== JSON.stringify(newLogs)) {
                    setLogs(newLogs);
                    logsRef.current = newLogs;
                    setLogLevelCounts(countLogLevels()); // Update log level counts after updating logs
                }
            }
        };

        updateLogs();
        const intervalId = setInterval(() => {
            updateLogs();
        }, 30000); // Fetch logs every 30 seconds, adjust as needed

        return () => clearInterval(intervalId);
    }, [accessDenied]); // Add 'accessDenied' to the dependency array



    const renderSection = (title, logs) => {
        if (logs.length === 0) {
            return null;
        }

        return (
            <>
                {/* <Title level={3}>{title}</Title> */}
                <div
                    style={{
                        maxHeight: `calc(${itemsPerPage} * 1.4rem)`, // Adjust height based on itemsPerPage
                        overflowY: 'auto',
                        marginBottom: '1rem',
                    }}
                >
                    <TransitionGroup>
                        {logs.map((logComponent) => (
                            <CSSTransition key={logComponent.key} timeout={500} classNames="log">
                                {logComponent}
                            </CSSTransition>
                        ))}
                    </TransitionGroup>
                </div>
            </>
        );
    };

    const logComponents = React.useMemo(() => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const timestampRegex = /^(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2},\d{3}/;
        const logLevelRegex = / - (INFO|WARNING|ERROR|EXCEPTION|FATAL|DEBUG) - /;
        const classRegex = / - (\w+)\.py:/;

        const sections = {
            today: [],
            yesterday: [],
            older: [],
        };

        let entryIndex = 0;
        let currentSection = 'older';

        logs.forEach((logEntry, index) => {
            const log = logEntry.content;
            const matchesTimestamp = log.match(timestampRegex);
            const matchesLogLevel = log.match(logLevelRegex);
            const matchesClass = log.match(classRegex);
            const selectedClassFilter =
                selectedClass === 'All Components' || (matchesClass && matchesClass[1] === selectedClass);

            if (matchesTimestamp) {
                if (matchesTimestamp[1] === todayStr) {
                    currentSection = 'today';
                } else if (matchesTimestamp[1] === yesterdayStr) {
                    currentSection = 'yesterday';
                } else {
                    currentSection = 'older';
                }
            }

            if (
                matchesLogLevel &&
                selectedClassFilter &&
                (selectedLogLevel === 'ALL' || matchesLogLevel[1] === selectedLogLevel)
            ) {
                if (timestampRegex.test(log)) {
                    entryIndex += 1;
                }

                const logComponent = <LogEntry key={logEntry.id} logEntry={logEntry} index={index} />;

                sections[currentSection].push(logComponent);
            } else if (!matchesTimestamp && sections[currentSection].length > 0) {
                // Append the line to the last log component in the current section
                const lastLogComponent = sections[currentSection][sections[currentSection].length - 1];
                lastLogComponent.props.logEntry.content += '\n' + log;
            }
        });

        return sections;
    }, [logs, selectedLogLevel, selectedClass]);

    const { Panel } = Collapse;

    const renderLogs = () => {
        if (error) {
            return <Alert message={error} type="error" />;
        } else {
            return (
                <Collapse defaultActiveKey={['today']}>
                    <Panel header="Today" key="today">
                        {renderSection('Today', logComponents.today)}
                    </Panel>
                    <Panel header="Yesterday" key="yesterday">
                        {renderSection('Yesterday', logComponents.yesterday)}
                    </Panel>
                    <Panel header="Older" key="older">
                        {renderSection('Older', logComponents.older)}
                    </Panel>
                </Collapse>
            );
        }
    };

    const handleLogLevelChange = (value) => {
        setSelectedLogLevel(value);
        setSelectedClass('All Components'); // Reset the selected class when the log level is changed
    };

    const handleClassChange = (value) => {
        setSelectedClass(value);
    };

    const [itemsPerPage, setItemsPerPage] = useState(20);

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(parseInt(value, 10));
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Select
                    defaultValue="ALL"
                    style={{ width: 150, marginRight: 16 }}
                    onChange={handleLogLevelChange}
                >
                    <Option value="ALL">All Levels ({logLevelCounts.ALL})</Option>
                    <Option value="INFO">INFO ({logLevelCounts.INFO})</Option>
                    <Option value="WARNING">WARNING ({logLevelCounts.WARNING})</Option>
                    <Option value="ERROR">ERROR ({logLevelCounts.ERROR})</Option>
                    <Option value="EXCEPTION">EXCEPTION ({logLevelCounts.EXCEPTION})</Option>
                    <Option value="FATAL">FATAL ({logLevelCounts.FATAL})</Option>
                    <Option value="DEBUG">DEBUG ({logLevelCounts.DEBUG})</Option>
                </Select>
                <Select
                    defaultValue="All Components"
                    style={{ width: 150, marginRight: 16 }}
                    onChange={handleClassChange}
                >
                    {availableClasses.map((classValue) => (
                        <Option value={classValue} key={classValue}>
                            {classValue}
                        </Option>
                    ))}
                </Select>
                <Select
                    defaultValue={`${itemsPerPage}`}
                    style={{ width: 120, marginRight: 16 }}
                    onChange={handleItemsPerPageChange}
                >
                    <Option value="10" label="10">10 per page</Option>
                    <Option value="20" label="20">20 per page</Option>
                    <Option value="50" label="50">50 per page</Option>
                    <Option value="100" label="100">100 per page</Option>
                </Select>
                <Button onClick={downloadLogs} style={{ marginBottom: 16 }}>Download Logs</Button>
            </div>
            {renderLogs()}
        </div>
    );
};

export default LogViewer;
