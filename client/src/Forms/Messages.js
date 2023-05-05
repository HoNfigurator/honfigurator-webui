
export const WarningMessageTCP = ({ port }) => (
    <>
        <p>The server could not be contacted over port {port || 5000}.</p>
        <p>Please ensure the following:</p>
        <ul>
            <li>HoNfigurator API is running</li>
            <li>Firewall is not blocking</li>
            <li>Network router is forwarding ports</li>
        </ul>
    </>
);

export const WarningMessageDenied = () => (
    <>
        <p>The server received your request, but you are unauthorized.</p>
        <p>Please ensure that the owner of the server has granted you access.</p>
    </>
);

export const errorMessage = (error) => (
    <>
        <p>Failed to add the server.</p>
        <p>{error.message}</p>
        {error.response && error.response.data && (
            <p>
                {error.response.data.error || error.response.data.message}
            </p>
        )}
    </>
);