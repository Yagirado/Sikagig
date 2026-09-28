import { useParams } from "react-router";
import RoomChatContent from "./roomChatContent";

export default function RoomChat() {
    const { conversationId } = useParams();

    return (
        <RoomChatContent
            key={conversationId}
            conversationId={conversationId}
        />
    );

    
}
