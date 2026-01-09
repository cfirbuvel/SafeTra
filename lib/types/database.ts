export interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    id_number?: string;
    teudat_zehut?: string;
    first_name?: string;
    last_name?: string;
    invited_by?: string;
    created_at?: string;
    role?: 'user' | 'lawyer';
    avatar_url?: string;
}

export type DealStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'AWAITING_PAYMENT'
    | 'PAYMENT_VERIFICATION'
    | 'OWNERSHIP_TRANSFER_PENDING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'EXPIRED'; // Keeping EXPIRED for backward compat/timeouts

export interface Deal {
    id: string;
    seller_id: string;
    buyer_id?: string;
    title: string;
    price_ils: number;
    status: DealStatus;
    license_plate?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    id_doc_url?: string;
    vehicle_reg_doc_url?: string;
    created_at?: string;
    // New fields
    first_name?: string;
    last_name?: string;
    owner_id_number?: string;
    engine_volume?: number;
    license_expiry_date?: string;
    previous_owners?: number;
    chassis_number?: string;
    kilometers?: number;
    vehicle_reg_owner_name?: string;
    vehicle_reg_owner_id?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    deal_id?: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'id'> & { id?: string };
                Update: Partial<Profile>;
            };
            deals: {
                Row: Deal;
                Insert: Omit<Deal, 'id'> & { id?: string };
                Update: Partial<Deal>;
            };
            notifications: {
                Row: Notification;
                Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Notification>;
            };
        };
    };
}

export class ProfileModel implements Profile {
    constructor(
        public id: string,
        public email: string,
        public full_name: string,
        public phone: string,
        public id_number?: string,
        public teudat_zehut?: string,
        public first_name?: string,
        public last_name?: string,
        public invited_by?: string,
        public created_at?: string,
        public role?: 'user' | 'lawyer'
    ) { }

    static fromRow(row: any): ProfileModel {
        return new ProfileModel(
            row.id,
            row.email,
            row.full_name,
            row.phone,
            row.id_number,
            row.teudat_zehut,
            row.first_name,
            row.last_name,
            row.invited_by,
            row.created_at,
            row.role
        );
    }
}
