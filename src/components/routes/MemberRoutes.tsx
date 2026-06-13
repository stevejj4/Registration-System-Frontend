import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MemberList, MemberDetails } from "@/features/members";

export const MemberListPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <MemberList onSelectMember={(id) => navigate(`/members/${id}`)} />
  );
};

export const MemberDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return null;
  }

  return (
    <MemberDetails
      memberId={id}
      onBack={() => navigate("/members")}
    />
  );
};
