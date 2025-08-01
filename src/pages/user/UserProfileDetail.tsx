import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { usePhotoStore } from "../../store/usePhotoStore";
import { toast } from "sonner";
import {
  FaImage,
  FaLock,
  FaUnlock,
  FaHourglassHalf,
  FaTimesCircle,
  FaComments,
  FaTimes,
} from "react-icons/fa"; // Added FaTimes for close button
import { useNavigate } from "react-router";
import { useChatStore } from "../../store/useChatStore"; // Import useChatStore
import { Filter } from "bad-words"; // Import Filter for message cleaning

const filter = new Filter(); // Initialize bad-words filter

interface ProfileWithPhotos {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  university: string;
  status: string;
  description: string;
  lookingFor: string;
  photos: { id: string; url: string }[];
  photoAccessStatus:
    | "restricted"
    | "pending"
    | "accepted"
    | "rejected"
    | "granted_self"
    | "granted_by_request";
}

interface UserProfileDetailProps {
  userId: string; // The ID of the user whose profile is being viewed
  onClose: () => void; // Function to close the modal
}

export default function UserProfileDetail({
  userId,
  onClose,
}: UserProfileDetailProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore(); // Authenticated user
  const {
    isLoading,
    error,
    fetchUserProfileWithPhotos,
    sendPhotoRequest,
    fetchSentRequests,
    sentRequests,
  } = usePhotoStore();
  const { sendMessage } = useChatStore(); // Get sendMessage from chat store

  const [profileData, setProfileData] = useState<ProfileWithPhotos | null>(
    null
  );
  const [isRequestingPhoto, setIsRequestingPhoto] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false); // State for message modal
  const [message, setMessage] = useState(""); // State for message input

  useEffect(() => {
    const loadProfile = async () => {
      if (userId) {
        const data = await fetchUserProfileWithPhotos(userId);
        setProfileData(data);
      }
    };

    loadProfile();
    fetchSentRequests(); // Always fetch sent requests to update button state
  }, [userId, fetchUserProfileWithPhotos, fetchSentRequests]);

  const handleRequestPhotos = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to request photos.");
      return;
    }
    if (!userId) {
      toast.error("Invalid user profile.");
      return;
    }

    setIsRequestingPhoto(true);
    try {
      await sendPhotoRequest(userId);
      // Optimistically update status to pending
      setProfileData((prev) =>
        prev ? { ...prev, photoAccessStatus: "pending" } : null
      );
    } catch (err) {
      // Error handled by zustand store already
    } finally {
      setIsRequestingPhoto(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    if (!profileData) {
      toast.error("No user profile data available to send message to.");
      return;
    }
    if (!currentUser?.id) {
      // Ensure current user's ID is available
      toast.error("Your user ID is not available. Please log in again.");
      return;
    }

    const cleanedMessage = filter.clean(message);

    // Call sendMessage from useChatStore with current user's ID as sender
    await sendMessage(currentUser.id, profileData._id, cleanedMessage);

    toast.success(`Message sent to ${profileData.firstName}.`);
    setMessage(""); // Clear message input
    setIsMessageModalOpen(false); // Close message modal
    onClose(); // Close the profile modal after sending message
    navigate(`/chats?userId=${profileData._id}`); // Navigate to chat page
  };

  // Determine button text and disable state for photo request
  const getPhotoRequestButtonState = () => {
    if (!profileData) return { text: "Loading...", disabled: true };

    // Check if a request has been sent by the current user to this target user
    const sentRequestStatus = sentRequests.find(
      (req) => req.targetUserId._id === profileData._id
    )?.status;

    switch (profileData.photoAccessStatus) {
      case "granted_by_request":
        return {
          text: "Photos Accessible",
          disabled: true,
          icon: <FaUnlock className="mr-2" />,
        };
      case "pending": // This means the target user has a pending request from us
        return {
          text: "Request Pending",
          disabled: true,
          icon: <FaHourglassHalf className="mr-2" />,
        };
      case "rejected":
        return {
          text: "Request Rejected",
          disabled: true,
          icon: <FaTimesCircle className="mr-2" />,
        };
      case "restricted":
      default:
        if (sentRequestStatus === "pending") {
          return {
            text: "Request Pending",
            disabled: true,
            icon: <FaHourglassHalf className="mr-2" />,
          };
        } else if (sentRequestStatus === "rejected") {
          return {
            text: "Request Rejected",
            disabled: true,
            icon: <FaTimesCircle className="mr-2" />,
          };
        }
        return {
          text: isRequestingPhoto ? "Sending Request..." : "Request Photos",
          disabled: isRequestingPhoto,
          icon: <FaImage className="mr-2" />,
        };
    }
  };

  const {
    text: buttonText,
    disabled: buttonDisabled,
    icon: buttonIcon,
  } = getPhotoRequestButtonState();

  if (isLoading && !profileData) {
    return <div className="p-6 text-center text-lg">Loading profile...</div>;
  }

  if (error || !profileData) {
    return (
      <div className="p-6 text-center text-red-500 text-lg">
        Error: {error || "Profile not found."}
      </div>
    );
  }

  // Placeholder for blurred image
  const blurredImageUrl =
    "https://placehold.co/400x300/cccccc/999999?text=Private+Photos";

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg animate-fadeIn h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          {profileData.firstName} {profileData.lastName}'s Profile
        </h2>
      </div>

      <div className="space-y-4 mb-6 flex-grow overflow-y-auto">
        <p className="text-gray-700">
          <span className="font-semibold">Age:</span> {profileData.age}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Gender:</span> {profileData.gender}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">University:</span>{" "}
          {profileData.university}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Status:</span> {profileData.status}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Description:</span>{" "}
          {profileData.description}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Looking For:</span>{" "}
          {profileData.lookingFor}
        </p>

        <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Photos</h3>
        {profileData.photoAccessStatus === "granted_self" ||
        profileData.photoAccessStatus === "granted_by_request" ? (
          <div>
            {profileData.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileData.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={`${profileData.firstName}'s photo`}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                This user has no photos uploaded or displayed.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
            <img
              src={blurredImageUrl}
              alt="Private Photos"
              className="absolute inset-0 w-full h-full object-cover filter blur-md"
            />
            <div className="relative z-10 flex flex-col items-center">
              <FaLock className="text-4xl mb-3 text-gray-500" />
              <p className="mb-3 font-semibold text-lg text-gray-800">
                Photos are private.
              </p>
              {profileData.photoAccessStatus === "pending" && (
                <p className="text-yellow-700 font-medium">
                  Your request is pending review.
                </p>
              )}
              {profileData.photoAccessStatus === "rejected" && (
                <p className="text-red-700 font-medium">
                  Your request was rejected.
                </p>
              )}
              {profileData.photoAccessStatus === "restricted" && (
                <button
                  onClick={handleRequestPhotos}
                  disabled={buttonDisabled}
                  className={`mt-4 px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${
                    buttonDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-700"
                  } flex items-center justify-center`}
                >
                  {buttonIcon} {buttonText}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons at the bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200 flex justify-center gap-4">
        {profileData.photoAccessStatus === "granted_self" ? (
          <button
            onClick={() => {
              onClose(); // Close modal first
              // Navigate to the user's own photo management page
              window.location.href = "/photos"; // Use window.location.href for full page reload if needed
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <FaImage className="mr-2" /> Manage Your Photos
          </button>
        ) : (
          <button
            onClick={() => setIsMessageModalOpen(true)} // Open message modal instead of navigating directly
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <FaComments className="mr-2" /> Chat with {profileData.firstName}
          </button>
        )}
      </div>

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fadeIn z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              onClick={() => setIsMessageModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold mb-4">
              Send Message to {profileData?.firstName}
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="Type your message..."
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
