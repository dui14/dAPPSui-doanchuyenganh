
import React from "react";
import {
  DynamicUserProfile,
  useDynamicContext
} from "@dynamic-labs/sdk-react-core";

export default function Account() {
  const { setShowDynamicUserProfile } = useDynamicContext();

  return (
    <>
      <button onClick={() => setShowDynamicUserProfile(true)} className="btn-secondary ml-auto">
        👤 Hồ sơ cá nhân
      </button>
      <DynamicUserProfile variant="modal" />
    </>
  );
}