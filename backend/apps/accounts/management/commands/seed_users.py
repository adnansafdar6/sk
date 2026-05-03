"""
Management command to seed 1000 fake users for development/testing.
Usage:
    python manage.py seed_users
    python manage.py seed_users --count 500
    python manage.py seed_users --clear   # delete existing fake users first
"""
import random
import string
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Kenneth", "Donna",
    "Joshua", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
    "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra",
    "Frank", "Rachel", "Alexander", "Carolyn", "Patrick", "Janet", "Jack", "Catherine",
    "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane", "Aaron", "Julie",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
    "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
]

DOMAINS = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "proton.me", "mail.com", "live.com", "example.com", "test.com",
]

STATUSES = ["active", "active", "active", "active", "suspended", "banned"]
VIP_LEVELS = [0, 0, 0, 0, 0, 1, 1, 2, 3]


def _random_phone():
    return "+1" + "".join(random.choices(string.digits, k=10))


def _random_wallet():
    return Decimal(str(round(random.uniform(0, 5000), 2)))


class Command(BaseCommand):
    help = "Seed fake users for development."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=1000, help="Number of users to create (default: 1000)")
        parser.add_argument("--clear", action="store_true", help="Delete existing fake users before seeding")

    def handle(self, *args, **options):
        count = options["count"]

        if options["clear"]:
            deleted, _ = User.objects.filter(email__endswith="@fake.seed").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing fake users."))

        created = 0
        skipped = 0
        batch = []

        self.stdout.write(f"Generating {count} fake users...")

        for i in range(count):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            suffix = "".join(random.choices(string.digits, k=4))
            username = f"{first.lower()}{last.lower()}{suffix}"
            email = f"{first.lower()}.{last.lower()}{suffix}@fake.seed"

            if User.objects.filter(email=email).exists():
                skipped += 1
                continue

            user = User(
                first_name=first,
                last_name=last,
                username=username,
                email=email,
                phone=_random_phone(),
                role="user",
                status=random.choice(STATUSES),
                vip_level=random.choice(VIP_LEVELS),
                wallet_balance=_random_wallet(),
                is_email_verified=random.choice([True, False]),
            )
            user.set_password("password123")
            # referral_code is auto-generated in model.save(), but bulk_create
            # skips save(), so generate it here.
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            user.referral_code = code
            user.is_active = user.status == "active"
            batch.append(user)

            if len(batch) >= 100:
                User.objects.bulk_create(batch, ignore_conflicts=True)
                created += len(batch)
                batch = []
                self.stdout.write(f"  ... {created} created so far")

        if batch:
            User.objects.bulk_create(batch, ignore_conflicts=True)
            created += len(batch)

        self.stdout.write(self.style.SUCCESS(f"Done. Created {created} fake users, skipped {skipped} duplicates."))
