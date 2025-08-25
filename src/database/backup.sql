--
-- PostgreSQL database dump
--

\restrict bvxDZ8i3sm5CYDNFMa8G9gqWNc2mnZqapiJKX3iQiwNVTyheQZcUoEKpjYTd8jw

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "remoteJid" text NOT NULL,
    "pushName" text,
    "profilePicUrl" text,
    email text,
    cpf text,
    cnpj text,
    priority integer DEFAULT 0,
    "isGroup" boolean DEFAULT false NOT NULL,
    "isSaved" boolean DEFAULT false NOT NULL,
    type text DEFAULT 'contact'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'blocked'::text]))),
    CONSTRAINT customers_type_check CHECK ((type = 'contact'::text))
);


ALTER TABLE public.customers OWNER TO ccs_user;

--
-- Name: groupParticipants; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public."groupParticipants" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "groupId" uuid NOT NULL,
    "participantId" text NOT NULL,
    jid text NOT NULL,
    lid text,
    admin text,
    role text DEFAULT 'member'::text NOT NULL,
    name text,
    "phoneNumber" text,
    "evolutionData" jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "profilePicture" text,
    CONSTRAINT "groupParticipants_admin_check" CHECK ((admin = ANY (ARRAY['superadmin'::text, 'admin'::text, ''::text]))),
    CONSTRAINT "groupParticipants_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))),
    CONSTRAINT "groupParticipants_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'removed'::text])))
);


ALTER TABLE public."groupParticipants" OWNER TO ccs_user;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "evolutionGroupId" text NOT NULL,
    instance text NOT NULL,
    subject text NOT NULL,
    description text,
    "descId" text,
    "pictureUrl" text,
    owner text NOT NULL,
    "subjectOwner" text,
    "subjectTime" bigint,
    creation bigint NOT NULL,
    restrict boolean DEFAULT false,
    announce boolean DEFAULT false,
    "isCommunity" boolean DEFAULT false,
    "isCommunityAnnounce" boolean DEFAULT false,
    size integer DEFAULT 0 NOT NULL,
    "evolutionData" jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT groups_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


ALTER TABLE public.groups OWNER TO ccs_user;

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255) DEFAULT NULL::character varying,
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO ccs_user;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: ccs_user
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_id_seq OWNER TO ccs_user;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ccs_user
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO ccs_user;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: ccs_user
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO ccs_user;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ccs_user
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: mailing; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.mailing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mailing OWNER TO ccs_user;

--
-- Name: messageTemplates; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public."messageTemplates" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messageTemplates_type_check" CHECK ((type = ANY (ARRAY['greeting'::text, 'follow_up'::text, 'reminder'::text, 'support'::text, 'marketing'::text, 'notification'::text, 'custom'::text])))
);


ALTER TABLE public."messageTemplates" OWNER TO ccs_user;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "sessionId" uuid,
    "evolutionMessageId" text,
    "remoteJid" text,
    "fromMe" boolean DEFAULT false,
    instance text,
    "pushName" text,
    source text,
    "messageTimestamp" bigint,
    "messageType" text NOT NULL,
    "from" text NOT NULL,
    direction text NOT NULL,
    content text,
    "mediaUrl" text,
    mimetype text,
    caption text,
    "fileName" text,
    "fileLength" text,
    "fileSha256" text,
    width integer,
    height integer,
    seconds integer,
    "isAnimated" boolean,
    ptt boolean,
    "pageCount" integer,
    latitude numeric(10,8),
    longitude numeric(11,8),
    "locationName" text,
    "locationAddress" text,
    "contactDisplayName" text,
    "contactVcard" text,
    "reactionText" text,
    "reactionToMessageId" text,
    "senderId" uuid,
    "senderName" text,
    "senderPhone" text,
    "typebotMessageId" text,
    "evolutionData" jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    "sentAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" timestamp with time zone,
    "readAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT messages_from_check CHECK (("from" = ANY (ARRAY['Customer'::text, 'Operator'::text, 'Typebot'::text, 'System'::text]))),
    CONSTRAINT "messages_messageType_check" CHECK (("messageType" = ANY (ARRAY['conversation'::text, 'imageMessage'::text, 'videoMessage'::text, 'audioMessage'::text, 'documentMessage'::text, 'stickerMessage'::text, 'contactMessage'::text, 'locationMessage'::text, 'reactionMessage'::text]))),
    CONSTRAINT messages_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text, 'failed'::text, 'pending'::text])))
);


ALTER TABLE public.messages OWNER TO ccs_user;

--
-- Name: queues; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.queues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "sessionId" uuid NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    department text NOT NULL,
    "requestedOperatorId" uuid,
    "assignedOperatorId" uuid,
    "supervisorId" uuid,
    "typebotData" jsonb DEFAULT '{}'::jsonb,
    "customerDepartmentChoice" text,
    "customerOperatorChoice" text,
    "operatorAvailable" boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "typebotCompletedAt" timestamp with time zone,
    "assignedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "evolutionInstance" text,
    "typebotSessionUrl" text,
    metadata jsonb DEFAULT '{}'::jsonb,
    "customerId" uuid,
    direction text DEFAULT 'inbound'::text NOT NULL,
    CONSTRAINT queues_department_check CHECK ((department = ANY (ARRAY['Personal'::text, 'Fiscal'::text, 'Accounting'::text, 'Financial'::text]))),
    CONSTRAINT queues_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT queues_status_check CHECK ((status = ANY (ARRAY['typebot'::text, 'waiting'::text, 'service'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.queues OWNER TO ccs_user;

--
-- Name: COLUMN queues.direction; Type: COMMENT; Schema: public; Owner: ccs_user
--

COMMENT ON COLUMN public.queues.direction IS 'Direction of the queue: inbound (customer initiated) or outbound (operator initiated)';


--
-- Name: tabulationStatus; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public."tabulationStatus" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public."tabulationStatus" OWNER TO ccs_user;

--
-- Name: tabulationStatusSub; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public."tabulationStatusSub" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "tabulationStatusId" uuid
);


ALTER TABLE public."tabulationStatusSub" OWNER TO ccs_user;

--
-- Name: tabulations; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.tabulations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "sessionId" uuid NOT NULL,
    "tabulatedBy" uuid NOT NULL,
    "tabulatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "tabulationId" uuid NOT NULL
);


ALTER TABLE public.tabulations OWNER TO ccs_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: ccs_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    login text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    contact text NOT NULL,
    "profilePicture" text,
    status text DEFAULT 'Active'::text NOT NULL,
    profile text NOT NULL,
    department text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT users_department_check CHECK ((department = ANY (ARRAY['Personal'::text, 'Fiscal'::text, 'Accounting'::text, 'Financial'::text]))),
    CONSTRAINT users_profile_check CHECK ((profile = ANY (ARRAY['Admin'::text, 'Supervisor'::text, 'Operator'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


ALTER TABLE public.users OWNER TO ccs_user;

--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.customers (id, "remoteJid", "pushName", "profilePicUrl", email, cpf, cnpj, priority, "isGroup", "isSaved", type, status, "createdAt", "updatedAt") FROM stdin;
1946e1c7-6d32-4f71-8367-da3e3746f001	5511944599533	Cris	\N	\N	\N	\N	0	f	f	contact	active	2025-08-22 16:03:43.147883+00	2025-08-22 16:05:23.938883+00
50c1cd34-fd7f-447b-bcb5-da89c8437788	5511945790077	Vinicius Facini	https://pps.whatsapp.net/v/t61.24694-24/521078231_1107777304548190_2650694005621592682_n.jpg?ccb=11-4&oh=01_Q5Aa2QHUX2jhUVMdipjpivAYw8WOwIuIObbV_oloaABAHvBUBw&oe=68B5C17A&_nc_sid=5e03e0&_nc_cat=100	\N	\N	\N	0	f	f	contact	active	2025-08-22 16:03:02.840766+00	2025-08-22 16:10:38.330822+00
21bf427a-282f-4010-abb1-0d769e82879e	5511949122854	yuucordeiro	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGWgOBneS-iIRDSKXm3bR5X54gt497XyLPJBkjuX9qT-w&oe=68B9818B&_nc_sid=5e03e0&_nc_cat=106	yuri.cordeiro@ubicua.com.br	41159005800	11111111111	0	f	f	contact	active	2025-08-06 18:40:55.477534+00	2025-08-25 13:47:27.432643+00
f8996897-a64e-4eec-97cf-b0df4dcc491e	5511999713755	JCMattiuzzi	https://pps.whatsapp.net/v/t61.24694-24/309673125_127191836782116_2945745414116387349_n.jpg?ccb=11-4&oh=01_Q5Aa2QGfIMkdR232O5YRpbBLXF24QXDnzOW-0lQqZ9ZtJVT7IA&oe=68AB7C52&_nc_sid=5e03e0&_nc_cat=104	\N	\N	\N	0	f	f	contact	active	2025-08-11 22:26:48.553119+00	2025-08-14 21:14:27.754389+00
05d7fc3b-68c5-4647-a973-5c32c6472bcc	5511930151575	Victor	\N	\N	\N	\N	0	f	f	contact	active	2025-08-15 15:30:22.866459+00	2025-08-15 15:30:22.866459+00
7fd5876f-f7db-4053-a126-95664fecca83	5511995553755	JCMattiuzzi - Ubicua	https://pps.whatsapp.net/v/t61.24694-24/319928765_1125079331532995_5962033485178832644_n.jpg?ccb=11-4&oh=01_Q5Aa2QF3tu3jwNMCrsu61H9hYodlVH5ODSAa-Fx_hsAJLwA4sA&oe=68B33CD6&_nc_sid=5e03e0&_nc_cat=111	\N	\N	\N	0	f	f	contact	active	2025-08-11 15:21:51.368589+00	2025-08-20 20:15:04.409818+00
c39e7dc5-20af-4ef5-92a8-56d485bb7600	5511982740276	Odair Victoriano	https://pps.whatsapp.net/v/t61.24694-24/462861482_1061552622174993_357053317107082519_n.jpg?ccb=11-4&oh=01_Q5Aa2QE_rT5RqUVBF9XekW7G_ku15UXikTAqjPv6mZpGNb6fdA&oe=68B357E4&_nc_sid=5e03e0&_nc_cat=110	\N	\N	\N	0	f	f	contact	active	2025-08-15 20:09:25.789838+00	2025-08-20 20:38:14.860645+00
155d1e91-e072-41c6-8b7a-c292e29ffa11	120363420423559074@g.us	JCMattiuzzi - Ubicua	https://pps.whatsapp.net/v/t61.24694-24/531633090_1296103032116520_1814058504083830875_n.jpg?ccb=11-4&oh=01_Q5Aa2QEITl4WypaQ7STR1yHSemT33H_ke2sZbJTh1UMJhfgyxA&oe=68B36417&_nc_sid=5e03e0&_nc_cat=111	\N	\N	\N	0	f	f	contact	active	2025-08-20 20:24:24.992832+00	2025-08-20 21:38:21.071048+00
a87eeab9-3fba-4d98-a823-2b1106a69a7a	120363401241665225@g.us	Victor	https://pps.whatsapp.net/v/t61.24694-24/518566633_1397478128025793_6550404928960005538_n.jpg?ccb=11-4&oh=01_Q5Aa2QEanx4QpDYOb5iHERTpmEoK0yRXQi6pdT05-DnQbHaI0w&oe=68AC6BF4&_nc_sid=5e03e0&_nc_cat=108	\N	\N	\N	0	f	f	contact	active	2025-08-08 19:13:12.869789+00	2025-08-15 15:58:46.350637+00
f6e7eed6-669f-44ba-b2d2-37e770cbaff8	5511999322383	Aline G Mattiuzzi	https://pps.whatsapp.net/v/t61.24694-24/247282164_128143826330603_4576764278977199378_n.jpg?ccb=11-4&oh=01_Q5Aa2QGlmWPVTlaHRVI0is5O7yjDgFXOhbOa908zJrzsKW14iA&oe=68B5BCA5&_nc_sid=5e03e0&_nc_cat=101	\N	\N	\N	0	f	f	contact	active	2025-08-11 15:02:17.474108+00	2025-08-22 16:04:18.61394+00
\.


--
-- Data for Name: groupParticipants; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public."groupParticipants" (id, "groupId", "participantId", jid, lid, admin, role, name, "phoneNumber", "evolutionData", metadata, status, "joinedAt", "updatedAt", "profilePicture") FROM stdin;
91c10ae5-c900-4e3d-83fc-96373b1590f9	0530d27b-1942-43a0-8bca-faa17492c9f9	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	\N	member	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGmpcRLxbUU8-ZVIOAJlHkCFUNMjXAKIWnrC4z5LfEyFA&oe=68AB718B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-14 20:12:52.789+00	2025-08-14 21:34:22.732+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGmpcRLxbUU8-ZVIOAJlHkCFUNMjXAKIWnrC4z5LfEyFA&oe=68AB718B&_nc_sid=5e03e0&_nc_cat=106
cbd9bea7-c632-43e2-b440-f68cf2bcce31	f6f7d88b-88e1-45b3-9065-706ed7ee005e	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	\N	member	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGmpcRLxbUU8-ZVIOAJlHkCFUNMjXAKIWnrC4z5LfEyFA&oe=68AB718B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-15 13:30:12.284+00	2025-08-15 13:30:12.278+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGmpcRLxbUU8-ZVIOAJlHkCFUNMjXAKIWnrC4z5LfEyFA&oe=68AB718B&_nc_sid=5e03e0&_nc_cat=106
8b19c9b2-ded3-42cf-9c3d-07cdb0363a38	f1e71b80-7bb1-49d8-8515-141fcc3a79d0	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	\N	member	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QFYDkuohrJTkIW8tmf-tKR9Tm_ygMmAmmjjlEXoIRi7sg&oe=68AB394B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-14 19:03:21.567+00	2025-08-14 19:03:21.566+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QFYDkuohrJTkIW8tmf-tKR9Tm_ygMmAmmjjlEXoIRi7sg&oe=68AB394B&_nc_sid=5e03e0&_nc_cat=106
37b542f2-24dc-4405-9db5-886cfad7a8da	f1e71b80-7bb1-49d8-8515-141fcc3a79d0	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": null}	{}	active	2025-08-14 19:03:21.575+00	2025-08-14 19:03:21.574+00	\N
696181f5-3103-4dcc-a6c7-5a3395379cb3	f5204a3f-5363-4bb2-99aa-0ab7d410af9c	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": null}	{}	active	2025-08-06 20:03:38.178+00	2025-08-15 18:00:51.297+00	\N
7c514ca5-7104-47a6-81dd-9c4323955471	dab18c68-1438-41ae-92ef-c8028e33b68a	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	\N	member	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGWgOBneS-iIRDSKXm3bR5X54gt497XyLPJBkjuX9qT-w&oe=68B9818B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-06 20:03:38.355+00	2025-08-25 13:51:59.177+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGWgOBneS-iIRDSKXm3bR5X54gt497XyLPJBkjuX9qT-w&oe=68B9818B&_nc_sid=5e03e0&_nc_cat=106
73b63fe3-ca10-4426-bb01-7a3795cc5328	f6f7d88b-88e1-45b3-9065-706ed7ee005e	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": null}	{}	active	2025-08-15 13:30:12.29+00	2025-08-15 13:30:12.288+00	\N
737afb62-6492-4460-9038-a6acbe4c74ac	0530d27b-1942-43a0-8bca-faa17492c9f9	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": null}	{}	active	2025-08-14 20:12:52.794+00	2025-08-14 21:34:22.741+00	\N
7880df20-5f3e-4bdf-af4c-f37c3652faa3	dab18c68-1438-41ae-92ef-c8028e33b68a	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109"}	{}	active	2025-08-06 20:03:38.361+00	2025-08-25 13:51:59.182+00	https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109
be89f91e-45a1-4552-b2f5-8ce978f2c6d1	dab18c68-1438-41ae-92ef-c8028e33b68a	5511982740276@s.whatsapp.net	5511982740276@s.whatsapp.net	25379045675058@lid	\N	member	Odair Victoriano	5511982740276	{"id": "5511982740276@s.whatsapp.net", "jid": "5511982740276@s.whatsapp.net", "lid": "25379045675058@lid", "name": "Odair Victoriano", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/462861482_1061552622174993_357053317107082519_n.jpg?ccb=11-4&oh=01_Q5Aa2AGP53XiF9np73zlhnysilZYrSU01MoRFcgkgowKKu-gYw&oe=689656E4&_nc_sid=5e03e0&_nc_cat=110"}	{}	removed	2025-08-06 20:03:38.367+00	2025-08-25 13:51:59.192+00	https://pps.whatsapp.net/v/t61.24694-24/462861482_1061552622174993_357053317107082519_n.jpg?ccb=11-4&oh=01_Q5Aa2AGP53XiF9np73zlhnysilZYrSU01MoRFcgkgowKKu-gYw&oe=689656E4&_nc_sid=5e03e0&_nc_cat=110
5f081e5b-2d21-45cf-8c38-52cd223e2602	dab18c68-1438-41ae-92ef-c8028e33b68a	5511995553755@s.whatsapp.net	5511995553755@s.whatsapp.net	270845083693225@lid	admin	admin	JCMattiuzzi - Ubicua	5511995553755	{"id": "5511995553755@s.whatsapp.net", "jid": "5511995553755@s.whatsapp.net", "lid": "270845083693225@lid", "name": "JCMattiuzzi - Ubicua", "admin": "admin", "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/319928765_1125079331532995_5962033485178832644_n.jpg?ccb=11-4&oh=01_Q5Aa2QF3tu3jwNMCrsu61H9hYodlVH5ODSAa-Fx_hsAJLwA4sA&oe=68B33CD6&_nc_sid=5e03e0&_nc_cat=111"}	{}	active	2025-08-06 20:03:38.372+00	2025-08-25 13:51:59.19+00	https://pps.whatsapp.net/v/t61.24694-24/319928765_1125079331532995_5962033485178832644_n.jpg?ccb=11-4&oh=01_Q5Aa2QF3tu3jwNMCrsu61H9hYodlVH5ODSAa-Fx_hsAJLwA4sA&oe=68B33CD6&_nc_sid=5e03e0&_nc_cat=111
3d9e42a8-5a7c-4ad3-b061-18de8379f65f	4472c284-6247-47a9-a22c-e1c8a1512608	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109"}	{}	active	2025-08-15 13:53:51.335+00	2025-08-25 13:51:58.651+00	https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109
a3226549-0a64-4483-8351-e88a2f269334	958a790b-c740-4550-b468-87de69fe8883	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	207726697263261@lid	superadmin	owner	\N	5511980731696	{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "name": null, "admin": "superadmin", "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109"}	{}	active	2025-08-20 20:21:18.811+00	2025-08-25 13:51:57.789+00	https://pps.whatsapp.net/v/t61.24694-24/518980557_772678868552482_8720655883043439988_n.jpg?ccb=11-4&oh=01_Q5Aa2QGT3m8g9DwbdXD0_IoyEs7IDHpuaq1qLw7qENEqSyqY-Q&oe=68B71387&_nc_sid=5e03e0&_nc_cat=109
46691ea1-e198-4215-9b61-dff9a26143be	958a790b-c740-4550-b468-87de69fe8883	5511995553755@s.whatsapp.net	5511995553755@s.whatsapp.net	270845083693225@lid	\N	member	JCMattiuzzi - Ubicua	5511995553755	{"id": "5511995553755@s.whatsapp.net", "jid": "5511995553755@s.whatsapp.net", "lid": "270845083693225@lid", "name": "JCMattiuzzi - Ubicua", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/319928765_1125079331532995_5962033485178832644_n.jpg?ccb=11-4&oh=01_Q5Aa2QF3tu3jwNMCrsu61H9hYodlVH5ODSAa-Fx_hsAJLwA4sA&oe=68B33CD6&_nc_sid=5e03e0&_nc_cat=111"}	{}	active	2025-08-20 20:28:26.819+00	2025-08-25 13:51:57.799+00	https://pps.whatsapp.net/v/t61.24694-24/319928765_1125079331532995_5962033485178832644_n.jpg?ccb=11-4&oh=01_Q5Aa2QF3tu3jwNMCrsu61H9hYodlVH5ODSAa-Fx_hsAJLwA4sA&oe=68B33CD6&_nc_sid=5e03e0&_nc_cat=111
ba04e0e6-6389-4970-a835-af9787ecadf4	4472c284-6247-47a9-a22c-e1c8a1512608	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	admin	admin	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": "admin", "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGWgOBneS-iIRDSKXm3bR5X54gt497XyLPJBkjuX9qT-w&oe=68B9818B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-15 13:53:51.329+00	2025-08-25 13:51:58.643+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QGWgOBneS-iIRDSKXm3bR5X54gt497XyLPJBkjuX9qT-w&oe=68B9818B&_nc_sid=5e03e0&_nc_cat=106
ad9badf2-8cbb-490f-90b4-aa7e1d11724d	f5204a3f-5363-4bb2-99aa-0ab7d410af9c	5511949122854@s.whatsapp.net	5511949122854@s.whatsapp.net	250955039817818@lid	\N	member	yuucordeiro	5511949122854	{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "name": "yuucordeiro", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QE4gLQDov2VI5llUM-EVPLJEd_S9tO-Y_f4iK5e-83WDQ&oe=68AC528B&_nc_sid=5e03e0&_nc_cat=106"}	{}	active	2025-08-06 20:03:38.168+00	2025-08-15 18:00:51.292+00	https://pps.whatsapp.net/v/t61.24694-24/491873634_1485052745818331_6342340445076910916_n.jpg?ccb=11-4&oh=01_Q5Aa2QE4gLQDov2VI5llUM-EVPLJEd_S9tO-Y_f4iK5e-83WDQ&oe=68AC528B&_nc_sid=5e03e0&_nc_cat=106
a8ae0a31-5112-4794-8221-042eb583900e	f5204a3f-5363-4bb2-99aa-0ab7d410af9c	5511930151575@s.whatsapp.net	5511930151575@s.whatsapp.net	1859855101971@lid	\N	member	Victor	5511930151575	{"id": "5511930151575@s.whatsapp.net", "jid": "5511930151575@s.whatsapp.net", "lid": "1859855101971@lid", "name": "Victor", "admin": null, "imgUrl": null}	{}	removed	2025-08-15 15:45:45.513+00	2025-08-15 18:00:51.3+00	\N
ecac9c36-5bf2-4743-8e92-4477f5352b91	f5204a3f-5363-4bb2-99aa-0ab7d410af9c	5511982740276@s.whatsapp.net	5511982740276@s.whatsapp.net	25379045675058@lid	\N	member	Odair Victoriano	5511982740276	{"id": "5511982740276@s.whatsapp.net", "jid": "5511982740276@s.whatsapp.net", "lid": "25379045675058@lid", "name": "Odair Victoriano", "admin": null, "imgUrl": "https://pps.whatsapp.net/v/t61.24694-24/462861482_1061552622174993_357053317107082519_n.jpg?ccb=11-4&oh=01_Q5Aa2QFlpi_H_DaK1Riz4F3zfFIx-yyBQauWdLwLhZlVvy8TyA&oe=68AC4FE4&_nc_sid=5e03e0&_nc_cat=110"}	{}	removed	2025-08-15 15:32:50.332+00	2025-08-15 18:00:51.3+00	https://pps.whatsapp.net/v/t61.24694-24/462861482_1061552622174993_357053317107082519_n.jpg?ccb=11-4&oh=01_Q5Aa2QFlpi_H_DaK1Riz4F3zfFIx-yyBQauWdLwLhZlVvy8TyA&oe=68AC4FE4&_nc_sid=5e03e0&_nc_cat=110
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.groups (id, "evolutionGroupId", instance, subject, description, "descId", "pictureUrl", owner, "subjectOwner", "subjectTime", creation, restrict, announce, "isCommunity", "isCommunityAnnounce", size, "evolutionData", metadata, status, "createdAt", "updatedAt") FROM stdin;
f1e71b80-7bb1-49d8-8515-141fcc3a79d0	120363419705245347@g.us	5511980731696	Teste Grupo Yuri 2	Teste	3EB0F9328347F2FDEED355	\N	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1755198197	1755198197	f	f	f	f	2	{"id": "120363419705245347@g.us", "desc": "Teste", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB0F9328347F2FDEED355", "subject": "Teste Grupo Yuri 2", "announce": false, "creation": 1755198197, "restrict": false, "pictureUrl": null, "isCommunity": false, "subjectTime": 1755198197, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": null}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	inactive	2025-08-14 19:03:20.85+00	2025-08-14 19:03:20.85+00
0530d27b-1942-43a0-8bca-faa17492c9f9	120363420370415492@g.us	5511980731696	Teste Grupo Yuri 3	teste	3EB06CB62314F393AF13B9	https://pps.whatsapp.net/v/t61.24694-24/530098060_666672395719662_7353437138313426020_n.jpg?ccb=11-4&oh=01_Q5Aa2QE4k1Nipl6OGx55V011HHSiu0QgiBKnTfZy6n8Y9v53ow&oe=68AB6CBA&_nc_sid=5e03e0&_nc_cat=103	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1755202369	1755202369	f	f	f	f	2	{"id": "120363420370415492@g.us", "desc": "teste", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB06CB62314F393AF13B9", "subject": "Teste Grupo Yuri 3", "announce": false, "creation": 1755202369, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/530098060_666672395719662_7353437138313426020_n.jpg?ccb=11-4&oh=01_Q5Aa2QE4k1Nipl6OGx55V011HHSiu0QgiBKnTfZy6n8Y9v53ow&oe=68AB6CBA&_nc_sid=5e03e0&_nc_cat=103", "isCommunity": false, "subjectTime": 1755202369, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": null}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	inactive	2025-08-14 21:34:22.19+00	2025-08-15 13:42:31.664+00
f6f7d88b-88e1-45b3-9065-706ed7ee005e	120363401355016998@g.us	5511980731696	Teste Grupo Yuri 4	Teste	3EB00BEA50D763767F9627	https://pps.whatsapp.net/v/t61.24694-24/526060247_1676286583047190_3304335908227778453_n.jpg?ccb=11-4&oh=01_Q5Aa2QEQ_qx8KKafkdICxV5wsWgVOGebz8QiV9cHaGdzADjEFA&oe=68AC3C1F&_nc_sid=5e03e0&_nc_cat=110	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1755264609	1755264609	f	f	f	f	2	{"id": "120363401355016998@g.us", "desc": "Teste", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB00BEA50D763767F9627", "subject": "Teste Grupo Yuri 4", "announce": false, "creation": 1755264609, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/526060247_1676286583047190_3304335908227778453_n.jpg?ccb=11-4&oh=01_Q5Aa2QEQ_qx8KKafkdICxV5wsWgVOGebz8QiV9cHaGdzADjEFA&oe=68AC3C1F&_nc_sid=5e03e0&_nc_cat=110", "isCommunity": false, "subjectTime": 1755264609, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": null}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	inactive	2025-08-15 13:30:12.047+00	2025-08-15 13:43:01.237+00
dab18c68-1438-41ae-92ef-c8028e33b68a	120363420644124343@g.us	5511980731696	Grupo Unidas UBC	Unidas Contabilidade X Ubicua	3EB0C3F7E5BC9F6FFE0523	https://pps.whatsapp.net/v/t61.24694-24/518572660_1270376304704042_5754670761567451467_n.jpg?ccb=11-4&oh=01_Q5Aa2QGLjo64tXiwvddBGC_1X1xnhdv9T3BhzNkJRlundq-yJA&oe=68B9629B&_nc_sid=5e03e0&_nc_cat=102	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1753106161	1753105331	f	f	f	f	3	{"id": "120363420644124343@g.us", "desc": "Unidas Contabilidade X Ubicua", "size": 3, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB0C3F7E5BC9F6FFE0523", "subject": "Grupo Unidas UBC", "announce": false, "creation": 1753105331, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/518572660_1270376304704042_5754670761567451467_n.jpg?ccb=11-4&oh=01_Q5Aa2QGLjo64tXiwvddBGC_1X1xnhdv9T3BhzNkJRlundq-yJA&oe=68B9629B&_nc_sid=5e03e0&_nc_cat=102", "isCommunity": false, "subjectTime": 1753106161, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": null}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}, {"id": "5511995553755@s.whatsapp.net", "jid": "5511995553755@s.whatsapp.net", "lid": "270845083693225@lid", "admin": "admin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	active	2025-08-25 13:51:58.662+00	2025-08-25 13:51:58.666+00
4472c284-6247-47a9-a22c-e1c8a1512608	120363406944197794@g.us	5511980731696	Grupo temporario alter	teste 2	3EB02EB8C5AF64FEF8BAD3	https://pps.whatsapp.net/v/t61.24694-24/521507520_651822594614876_7162222786995927576_n.jpg?ccb=11-4&oh=01_Q5Aa2QHbFpMtdkyjMeES4tzcFYRd1YyWCKQDl_fzPoztjstWfA&oe=68B96CA4&_nc_sid=5e03e0&_nc_cat=103	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1755267032	1755266028	f	f	f	f	2	{"id": "120363406944197794@g.us", "desc": "teste 2", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB02EB8C5AF64FEF8BAD3", "subject": "Grupo temporario alter", "announce": false, "creation": 1755266028, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/521507520_651822594614876_7162222786995927576_n.jpg?ccb=11-4&oh=01_Q5Aa2QHbFpMtdkyjMeES4tzcFYRd1YyWCKQDl_fzPoztjstWfA&oe=68B96CA4&_nc_sid=5e03e0&_nc_cat=103", "isCommunity": false, "subjectTime": 1755267032, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": "admin"}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	active	2025-08-25 13:51:57.814+00	2025-08-25 13:51:57.818+00
958a790b-c740-4550-b468-87de69fe8883	120363420423559074@g.us	5511980731696	Grupo de Teste II	Apenas teste	3EB0EA2425E569E1617F3A	https://pps.whatsapp.net/v/t61.24694-24/531633090_1296103032116520_1814058504083830875_n.jpg?ccb=11-4&oh=01_Q5Aa2QH0otH9PkABi2dgR62CZLwt5jyjsa6-e78fvKtLovC5Jg&oe=68B98B17&_nc_sid=5e03e0&_nc_cat=111	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1755721705	1755721274	f	f	f	f	2	{"id": "120363420423559074@g.us", "desc": "Apenas teste", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB0EA2425E569E1617F3A", "subject": "Grupo de Teste II", "announce": false, "creation": 1755721274, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/531633090_1296103032116520_1814058504083830875_n.jpg?ccb=11-4&oh=01_Q5Aa2QH0otH9PkABi2dgR62CZLwt5jyjsa6-e78fvKtLovC5Jg&oe=68B98B17&_nc_sid=5e03e0&_nc_cat=111", "isCommunity": false, "subjectTime": 1755721705, "participants": [{"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}, {"id": "5511995553755@s.whatsapp.net", "jid": "5511995553755@s.whatsapp.net", "lid": "270845083693225@lid", "admin": null}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	active	2025-08-25 13:51:56.853+00	2025-08-25 13:51:56.938+00
f5204a3f-5363-4bb2-99aa-0ab7d410af9c	120363401241665225@g.us	5511980731696	Teste Grupo Yuri	Rent a car	3EB03EBFC0F043B790C8F6	https://pps.whatsapp.net/v/t61.24694-24/518566633_1397478128025793_6550404928960005538_n.jpg?ccb=11-4&oh=01_Q5Aa2QHOaY4OgDTPdnG705T5iRwITed7hgHwaq8ZCCfZ9r5ojA&oe=68ACA434&_nc_sid=5e03e0&_nc_cat=108	5511980731696@s.whatsapp.net	5511980731696@s.whatsapp.net	1753738313	1753738313	f	f	f	f	2	{"id": "120363401241665225@g.us", "desc": "Rent a car", "size": 2, "owner": "5511980731696@s.whatsapp.net", "descId": "3EB03EBFC0F043B790C8F6", "subject": "Teste Grupo Yuri", "announce": false, "creation": 1753738313, "restrict": false, "pictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/518566633_1397478128025793_6550404928960005538_n.jpg?ccb=11-4&oh=01_Q5Aa2QHOaY4OgDTPdnG705T5iRwITed7hgHwaq8ZCCfZ9r5ojA&oe=68ACA434&_nc_sid=5e03e0&_nc_cat=108", "isCommunity": false, "subjectTime": 1753738313, "participants": [{"id": "5511949122854@s.whatsapp.net", "jid": "5511949122854@s.whatsapp.net", "lid": "250955039817818@lid", "admin": null}, {"id": "5511980731696@s.whatsapp.net", "jid": "5511980731696@s.whatsapp.net", "lid": "207726697263261@lid", "admin": "superadmin"}], "subjectOwner": "5511980731696@s.whatsapp.net", "isCommunityAnnounce": false}	{}	inactive	2025-08-15 18:00:51.027+00	2025-08-15 18:02:25.268+00
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
1	001_create_users_table.ts	1	2025-08-05 19:46:29.432+00
2	002_create_queue_table.ts	2	2025-08-05 21:56:13.62+00
3	003_create_messages_table.ts	2	2025-08-05 21:56:13.745+00
4	004_create_customers_table.ts	3	2025-08-06 17:28:17.12+00
5	005_modify_queue_table_add_customer_relation.ts	4	2025-08-06 17:48:19.186+00
6	006_create_groups_table.ts	5	2025-08-06 19:37:56.59+00
7	007_create_group_participants_table.ts	5	2025-08-06 19:37:56.649+00
8	008_add_profile_picture_to_group_participants.ts	6	2025-08-06 20:13:17.6+00
9	004_update_messages_senderid_constraint.ts	7	2025-08-07 15:39:36.823+00
10	009_remove_messages_sessionid_foreign_key.ts	8	2025-08-08 20:07:26.809+00
11	010_add_direction_to_queue_table.ts	9	2025-08-09 15:35:50.774+00
14	011_create_tabulation_status_sub_table.ts	10	2025-08-11 17:23:22.503+00
15	012_create_tabulation_status_table.ts	10	2025-08-11 17:23:22.542+00
16	013_create_tabulations_table.ts	10	2025-08-11 17:23:22.608+00
17	014_add_active_field_to_tabulation_tables.ts	11	2025-08-11 17:48:50.025+00
18	015_add_tabulation_status_id_to_sub_table.ts	12	2025-08-11 18:02:48.166+00
19	016_fix_tabulation_status_relationship.ts	13	2025-08-11 18:11:33.038+00
20	017_add_active_field_to_users_table.ts	14	2025-08-11 22:05:38.985+00
21	018_create_message_templates_table.ts	15	2025-08-13 13:24:56.846+00
22	008_create_mailing_table.ts	16	2025-08-19 17:40:35.057+00
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Data for Name: mailing; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.mailing (id, name, url, message, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messageTemplates; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public."messageTemplates" (id, message, type, "createdAt", "updatedAt") FROM stdin;
570d35c1-1e27-4e39-9f6d-5f7d26616c3a	Bom dia	greeting	2025-08-13 14:28:20.541+00	2025-08-13 14:28:20.541+00
01278c00-1b7b-471c-af04-fad30e143c1c	Boa tarde	greeting	2025-08-13 14:29:29.99+00	2025-08-13 14:29:29.99+00
4a54332b-fb89-4b21-a236-4d1697c3ac6d	Boa noite	reminder	2025-08-13 14:47:19.375+00	2025-08-13 15:31:36.1+00
77d61af3-f1e3-4921-8f9b-29854cfb16db	Como posso ajudar?	greeting	2025-08-13 15:32:40.652+00	2025-08-13 15:32:40.652+00
55dba0b2-c833-446e-abb4-92dddc327aab	Voltarei a te ligar	reminder	2025-08-14 21:08:28.098+00	2025-08-14 21:08:28.098+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.messages (id, "sessionId", "evolutionMessageId", "remoteJid", "fromMe", instance, "pushName", source, "messageTimestamp", "messageType", "from", direction, content, "mediaUrl", mimetype, caption, "fileName", "fileLength", "fileSha256", width, height, seconds, "isAnimated", ptt, "pageCount", latitude, longitude, "locationName", "locationAddress", "contactDisplayName", "contactVcard", "reactionText", "reactionToMessageId", "senderId", "senderName", "senderPhone", "typebotMessageId", "evolutionData", metadata, status, "sentAt", "deliveredAt", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.queues (id, "sessionId", status, department, "requestedOperatorId", "assignedOperatorId", "supervisorId", "typebotData", "customerDepartmentChoice", "customerOperatorChoice", "operatorAvailable", "createdAt", "typebotCompletedAt", "assignedAt", "completedAt", "evolutionInstance", "typebotSessionUrl", metadata, "customerId", direction) FROM stdin;
\.


--
-- Data for Name: tabulationStatus; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public."tabulationStatus" (id, description, active) FROM stdin;
47787861-e05e-4b75-905a-974c70bcd3b5	TESTE 2	f
f658d02f-91ed-44b6-84ea-d3823ca69962	RESOLVIDO	t
865f27db-40b2-4a2e-a730-6f8bf60e194d	RESOLVIDO PARCIALMENTE	t
023a6150-43ea-4fc9-84e0-29e0d1913260	NAO RESOLVIDO	t
97e555ed-6024-474a-bb15-63e16f02434d	Teste	f
4a1b398e-7100-44a9-8578-2f87bc88518b	OUTROS	t
\.


--
-- Data for Name: tabulationStatusSub; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public."tabulationStatusSub" (id, description, active, "tabulationStatusId") FROM stdin;
48ee56ba-42d1-4ac4-a4df-1558c960588c	Teste 1	t	97e555ed-6024-474a-bb15-63e16f02434d
ad66056d-b015-44cd-aa26-bcc24785f0d9	Teste 2	t	97e555ed-6024-474a-bb15-63e16f02434d
de4bc951-73e8-4faf-b2a8-6bd7c3710311	TESTE 3	t	97e555ed-6024-474a-bb15-63e16f02434d
04f608d6-c635-4021-bfb6-4a01442d9fa9	SUB 1	t	47787861-e05e-4b75-905a-974c70bcd3b5
eea7a00a-8cf0-4d74-be95-cc146a3b78cd	COM SUCESSO	t	f658d02f-91ed-44b6-84ea-d3823ca69962
ed43760f-f330-4e9f-82cd-e455b9425f08	PENDENCIA	t	865f27db-40b2-4a2e-a730-6f8bf60e194d
0395a101-7e2a-4d51-891e-b925fd036292	PRECISA RETORNAR	t	023a6150-43ea-4fc9-84e0-29e0d1913260
8ff42bf4-069f-4af9-904b-86a2a165dbc9	OUTROS	t	4a1b398e-7100-44a9-8578-2f87bc88518b
\.


--
-- Data for Name: tabulations; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.tabulations (id, "sessionId", "tabulatedBy", "tabulatedAt", "tabulationId") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ccs_user
--

COPY public.users (id, login, password, name, email, contact, "profilePicture", status, profile, department, "createdAt", "updatedAt", active) FROM stdin;
51115431-67db-11f0-955f-000c2921356b	samara.carla	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Samara de Carla	samara@ubicua.com	+5511999999993	\N	Active	Supervisor	Personal	2025-07-23 15:40:10+00	2025-07-23 15:40:10+00	t
51118dfd-67db-11f0-955f-000c2921356b	andressa	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Andressa Monteiro	andressa@ubicua.com	+5511999999994	\N	Active	Operator	Personal	2025-07-23 15:40:10+00	2025-07-23 15:40:10+00	t
5111c31a-67db-11f0-955f-000c2921356b	thayse.lima	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Thayse Lima	thayse@ubicua.com	+5511999999995	\N	Active	Operator	Personal	2025-07-23 15:40:10+00	2025-07-23 15:40:10+00	t
8f97f9a3-67db-11f0-955f-000c2921356b	elaine.dias	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Elaine Dias	elaine@ubicua.com	+5511999999999	\N	Active	Operator	Fiscal	2025-07-23 15:41:55+00	2025-07-23 15:41:55+00	t
8f9817a3-67db-11f0-955f-000c2921356b	vinicius.facini	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Vinicius Facini	vinicius@ubicua.com	+5511999999990	\N	Active	Operator	Fiscal	2025-07-23 15:41:55+00	2025-07-23 15:41:55+00	t
d817234e-67e5-11f0-955f-000c2921356b	renan.santos	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Renan Santos	renan@ubicua.com	+5511999999981	\N	Active	Operator	Accounting	2025-07-23 16:55:31+00	2025-07-23 16:55:31+00	t
d817786f-67e5-11f0-955f-000c2921356b	joao.victor	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	João Victor	joao@ubicua.com	+5511999999982	\N	Active	Operator	Accounting	2025-07-23 16:55:31+00	2025-07-23 16:55:31+00	t
d817895d-67e5-11f0-955f-000c2921356b	victor.silva	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Victor Silva	victor@ubicua.com	+5511999999983	\N	Active	Operator	Accounting	2025-07-23 16:55:31+00	2025-07-23 16:55:31+00	t
1d597446-329f-11ec-a9d6-000c29a3e400	ubc.atendente	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Ubicua Atendente	ubcatende@ubicua.com	+5511999999991	\N	Active	Admin	Personal	2021-10-21 18:45:51+00	2021-10-21 18:45:51+00	t
48512c15-6497-11ee-8da1-ac1f6bf53052	ubc.supervisor	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Ubicua Supervisor	ubcsuper@ubicua.com	+5511999999992	\N	Active	Admin	Personal	2023-10-06 22:25:41+00	2023-10-06 22:25:41+00	t
c7b2174a-667c-11f0-955f-000c2921356b	jc.mattiuzzi	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	JCMattiuzzi	jc.mattiuzzi@ubicua.com	+5511999999996	\N	Active	Admin	Financial	2025-07-21 21:50:56+00	2025-07-21 21:50:56+00	t
0f37b628-67e6-11f0-955f-000c2921356b	matheus.godoi	$2b$10$v5NZ1wOeHXw2mh.ifrO71.lkN6I1IGNWTY/hptvuhz4Eqn6Ssiyfu	Matheus Godoy	matheus@ubicua.com	+5511999999984	\N	Active	Operator	Financial	2025-07-23 16:57:04+00	2025-08-11 22:01:07.576+00	t
032a47fd-57c4-47e2-bcc7-75a1286e8c12	victor.lima	$2b$10$Ss9noY/ZhZhO200AXPuWjOJL7FC36FRxofdWnsI18HfhX6NUv..y.	Victor Lima	victor.lima@unidascontabilidade.com.br	11999999933	\N	Active	Operator	Financial	2025-08-13 21:13:01.080969+00	2025-08-13 21:13:01.080969+00	t
8f978bff-67db-11f0-955f-000c2921356b	aline.guarnieri	$2b$10$SKCsWnOH9q5t6mtmjLxESOcjuuoH7LXkFKcd/LCdqvjcrerOGar2y	Aline Guarnieri	aline@ubicua.com	+5511999999997	\N	Active	Supervisor	Fiscal	2025-07-23 15:41:55+00	2025-08-22 15:54:11.499+00	t
8f97b9b3-67db-11f0-955f-000c2921356b	cristiane.andrino	$2b$10$RZQZbsjVn5R90fiWW/kOOuDv8ABqFhG19qfvKE/NKPe4KibKKzLca	Cristiane Andrino	cristiane@unidascontabilidade.com.br	+5511999999998	\N	Active	Operator	Fiscal	2025-07-23 15:41:55+00	2025-08-22 15:57:12.929+00	t
5278d40c-37b4-4c24-aec6-64921676e505	yuri.cordeiro	$2b$10$9hFgOy8cTm9yj7HYDAS.r.Oby2Tyx7hr6QkcClYa5YAmAp4Eel4zq	Yuri Cordeiro	yuri.cordeiro@ubicua.com.br	5511949122854	\N	Active	Admin	Personal	2025-08-11 22:13:45.894303+00	2025-08-11 22:13:45.894303+00	t
\.


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ccs_user
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 22, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: ccs_user
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_remotejid_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_remotejid_unique UNIQUE ("remoteJid");


--
-- Name: groupParticipants groupParticipants_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."groupParticipants"
    ADD CONSTRAINT "groupParticipants_pkey" PRIMARY KEY (id);


--
-- Name: groupParticipants groupparticipants_groupid_participantid_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."groupParticipants"
    ADD CONSTRAINT groupparticipants_groupid_participantid_unique UNIQUE ("groupId", "participantId");


--
-- Name: groups groups_evolutiongroupid_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_evolutiongroupid_unique UNIQUE ("evolutionGroupId");


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: mailing mailing_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.mailing
    ADD CONSTRAINT mailing_pkey PRIMARY KEY (id);


--
-- Name: messageTemplates messageTemplates_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."messageTemplates"
    ADD CONSTRAINT "messageTemplates_pkey" PRIMARY KEY (id);


--
-- Name: messages messages_evolutionmessageid_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_evolutionmessageid_unique UNIQUE ("evolutionMessageId");


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- Name: queues queues_sessionid_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_sessionid_unique UNIQUE ("sessionId");


--
-- Name: tabulationStatusSub tabulationStatusSub_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."tabulationStatusSub"
    ADD CONSTRAINT "tabulationStatusSub_pkey" PRIMARY KEY (id);


--
-- Name: tabulationStatus tabulationStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."tabulationStatus"
    ADD CONSTRAINT "tabulationStatus_pkey" PRIMARY KEY (id);


--
-- Name: tabulations tabulations_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.tabulations
    ADD CONSTRAINT tabulations_pkey PRIMARY KEY (id);


--
-- Name: users users_contact_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_contact_unique UNIQUE (contact);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_login_unique; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_unique UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: customers_cnpj_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_cnpj_index ON public.customers USING btree (cnpj);


--
-- Name: customers_cpf_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_cpf_index ON public.customers USING btree (cpf);


--
-- Name: customers_email_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_email_index ON public.customers USING btree (email);


--
-- Name: customers_isgroup_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_isgroup_index ON public.customers USING btree ("isGroup");


--
-- Name: customers_issaved_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_issaved_index ON public.customers USING btree ("isSaved");


--
-- Name: customers_priority_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_priority_index ON public.customers USING btree (priority);


--
-- Name: customers_remotejid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_remotejid_index ON public.customers USING btree ("remoteJid");


--
-- Name: customers_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_status_index ON public.customers USING btree (status);


--
-- Name: customers_type_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX customers_type_index ON public.customers USING btree (type);


--
-- Name: groupparticipants_groupid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_groupid_index ON public."groupParticipants" USING btree ("groupId");


--
-- Name: groupparticipants_groupid_role_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_groupid_role_index ON public."groupParticipants" USING btree ("groupId", role);


--
-- Name: groupparticipants_groupid_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_groupid_status_index ON public."groupParticipants" USING btree ("groupId", status);


--
-- Name: groupparticipants_jid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_jid_index ON public."groupParticipants" USING btree (jid);


--
-- Name: groupparticipants_participantid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_participantid_index ON public."groupParticipants" USING btree ("participantId");


--
-- Name: groupparticipants_participantid_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_participantid_status_index ON public."groupParticipants" USING btree ("participantId", status);


--
-- Name: groupparticipants_role_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_role_index ON public."groupParticipants" USING btree (role);


--
-- Name: groupparticipants_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groupparticipants_status_index ON public."groupParticipants" USING btree (status);


--
-- Name: groups_creation_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_creation_index ON public.groups USING btree (creation);


--
-- Name: groups_evolutiongroupid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_evolutiongroupid_index ON public.groups USING btree ("evolutionGroupId");


--
-- Name: groups_instance_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_instance_index ON public.groups USING btree (instance);


--
-- Name: groups_instance_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_instance_status_index ON public.groups USING btree (instance, status);


--
-- Name: groups_owner_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_owner_index ON public.groups USING btree (owner);


--
-- Name: groups_owner_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_owner_status_index ON public.groups USING btree (owner, status);


--
-- Name: groups_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_status_index ON public.groups USING btree (status);


--
-- Name: groups_subject_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX groups_subject_index ON public.groups USING btree (subject);


--
-- Name: mailing_createdat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX mailing_createdat_index ON public.mailing USING btree ("createdAt");


--
-- Name: mailing_name_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX mailing_name_index ON public.mailing USING btree (name);


--
-- Name: messages_direction_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_direction_index ON public.messages USING btree (direction);


--
-- Name: messages_evolutionmessageid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_evolutionmessageid_index ON public.messages USING btree ("evolutionMessageId");


--
-- Name: messages_fromme_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_fromme_index ON public.messages USING btree ("fromMe");


--
-- Name: messages_instance_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_instance_index ON public.messages USING btree (instance);


--
-- Name: messages_messagetype_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_messagetype_index ON public.messages USING btree ("messageType");


--
-- Name: messages_remotejid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_remotejid_index ON public.messages USING btree ("remoteJid");


--
-- Name: messages_senderid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_senderid_index ON public.messages USING btree ("senderId");


--
-- Name: messages_sentat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_sentat_index ON public.messages USING btree ("sentAt");


--
-- Name: messages_sessionid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_sessionid_index ON public.messages USING btree ("sessionId");


--
-- Name: messages_sessionid_sentat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_sessionid_sentat_index ON public.messages USING btree ("sessionId", "sentAt");


--
-- Name: messages_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messages_status_index ON public.messages USING btree (status);


--
-- Name: messagetemplates_createdat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messagetemplates_createdat_index ON public."messageTemplates" USING btree ("createdAt");


--
-- Name: messagetemplates_type_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX messagetemplates_type_index ON public."messageTemplates" USING btree (type);


--
-- Name: queues_assignedoperatorid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_assignedoperatorid_index ON public.queues USING btree ("assignedOperatorId");


--
-- Name: queues_createdat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_createdat_index ON public.queues USING btree ("createdAt");


--
-- Name: queues_customerid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_customerid_index ON public.queues USING btree ("customerId");


--
-- Name: queues_department_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_department_index ON public.queues USING btree (department);


--
-- Name: queues_direction_department_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_direction_department_index ON public.queues USING btree (direction, department);


--
-- Name: queues_direction_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_direction_index ON public.queues USING btree (direction);


--
-- Name: queues_direction_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_direction_status_index ON public.queues USING btree (direction, status);


--
-- Name: queues_sessionid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_sessionid_index ON public.queues USING btree ("sessionId");


--
-- Name: queues_status_assignedoperatorid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_status_assignedoperatorid_index ON public.queues USING btree (status, "assignedOperatorId");


--
-- Name: queues_status_department_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_status_department_index ON public.queues USING btree (status, department);


--
-- Name: queues_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX queues_status_index ON public.queues USING btree (status);


--
-- Name: tabulations_sessionid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulations_sessionid_index ON public.tabulations USING btree ("sessionId");


--
-- Name: tabulations_sessionid_tabulatedat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulations_sessionid_tabulatedat_index ON public.tabulations USING btree ("sessionId", "tabulatedAt");


--
-- Name: tabulations_tabulatedat_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulations_tabulatedat_index ON public.tabulations USING btree ("tabulatedAt");


--
-- Name: tabulations_tabulatedby_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulations_tabulatedby_index ON public.tabulations USING btree ("tabulatedBy");


--
-- Name: tabulations_tabulationid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulations_tabulationid_index ON public.tabulations USING btree ("tabulationId");


--
-- Name: tabulationstatus_active_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulationstatus_active_index ON public."tabulationStatus" USING btree (active);


--
-- Name: tabulationstatus_description_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulationstatus_description_index ON public."tabulationStatus" USING btree (description);


--
-- Name: tabulationstatussub_active_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulationstatussub_active_index ON public."tabulationStatusSub" USING btree (active);


--
-- Name: tabulationstatussub_description_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulationstatussub_description_index ON public."tabulationStatusSub" USING btree (description);


--
-- Name: tabulationstatussub_tabulationstatusid_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX tabulationstatussub_tabulationstatusid_index ON public."tabulationStatusSub" USING btree ("tabulationStatusId");


--
-- Name: users_active_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_active_index ON public.users USING btree (active);


--
-- Name: users_contact_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_contact_index ON public.users USING btree (contact);


--
-- Name: users_department_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_department_index ON public.users USING btree (department);


--
-- Name: users_email_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_email_index ON public.users USING btree (email);


--
-- Name: users_login_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_login_index ON public.users USING btree (login);


--
-- Name: users_profile_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_profile_index ON public.users USING btree (profile);


--
-- Name: users_status_index; Type: INDEX; Schema: public; Owner: ccs_user
--

CREATE INDEX users_status_index ON public.users USING btree (status);


--
-- Name: groupParticipants groupparticipants_groupid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."groupParticipants"
    ADD CONSTRAINT groupparticipants_groupid_foreign FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: queues queues_assignedoperatorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_assignedoperatorid_foreign FOREIGN KEY ("assignedOperatorId") REFERENCES public.users(id);


--
-- Name: queues queues_customerid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_customerid_foreign FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: queues queues_requestedoperatorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_requestedoperatorid_foreign FOREIGN KEY ("requestedOperatorId") REFERENCES public.users(id);


--
-- Name: queues queues_supervisorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_supervisorid_foreign FOREIGN KEY ("supervisorId") REFERENCES public.users(id);


--
-- Name: tabulations tabulations_sessionid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.tabulations
    ADD CONSTRAINT tabulations_sessionid_foreign FOREIGN KEY ("sessionId") REFERENCES public.queues("sessionId");


--
-- Name: tabulations tabulations_tabulatedby_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.tabulations
    ADD CONSTRAINT tabulations_tabulatedby_foreign FOREIGN KEY ("tabulatedBy") REFERENCES public.users(id);


--
-- Name: tabulations tabulations_tabulationid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public.tabulations
    ADD CONSTRAINT tabulations_tabulationid_foreign FOREIGN KEY ("tabulationId") REFERENCES public."tabulationStatusSub"(id);


--
-- Name: tabulationStatusSub tabulationstatussub_tabulationstatusid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ccs_user
--

ALTER TABLE ONLY public."tabulationStatusSub"
    ADD CONSTRAINT tabulationstatussub_tabulationstatusid_foreign FOREIGN KEY ("tabulationStatusId") REFERENCES public."tabulationStatus"(id);


--
-- PostgreSQL database dump complete
--

\unrestrict bvxDZ8i3sm5CYDNFMa8G9gqWNc2mnZqapiJKX3iQiwNVTyheQZcUoEKpjYTd8jw

