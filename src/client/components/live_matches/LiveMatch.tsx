import { useEffect, useState } from "react";
import { getApiUrl } from "../../utils/apiUtils";
import { base64JSONparse } from "../../../shared/generalUtils";
import { Scoresheet } from "../scoresheet/Scoresheet";

const LiveMatch: React.FC<{ matchId: number }> = ({ matchId }) => {
    const [sseData, setSseData] = useState<any>(undefined);

    useEffect(() => {
        const eventSource = new EventSource(`${getApiUrl()}/live_match/${matchId}`);

        eventSource.onmessage = (event) => {
            const newData = event.data;
            console.log("1.", newData);
            console.log("2.", base64JSONparse(newData));
            console.log("3.", base64JSONparse(newData).data);
            const parsedData = base64JSONparse(newData).data;
            setSseData(parsedData);
        };

        eventSource.onerror = (error) => {
            console.log("EventSource failed:", error);
            eventSource.close();
            setSseData(undefined);
        };

        // Suljetaan eventSource lopuksi:
        return () => {
            eventSource.close();
            setSseData(undefined);
        };
    }, [matchId]);

    console.log("sseData", sseData);

    if (!sseData) 
        return <></>;

    return (
        <Scoresheet initialValues={sseData} mode="display" />
    );
};

export { LiveMatch };