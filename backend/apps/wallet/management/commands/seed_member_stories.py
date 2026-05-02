"""
Management command — seeds 15 sample member stories for the landing page.

Usage:
    python manage.py seed_member_stories
    python manage.py seed_member_stories --clear   # wipe existing first
"""
from django.core.management.base import BaseCommand
from apps.wallet.models import MemberStory

STORIES = [
    {
        "name": "Sarah K.",
        "avatar_initials": "SK",
        "avatar_color": "from-violet-500 to-violet-700",
        "earned_amount": "$420",
        "months_active": 3,
        "quote": "I earned $120 in my first week just completing simple tasks. Upgrading to VIP 2 literally doubled my daily income overnight.",
        "sort_order": 1,
    },
    {
        "name": "James T.",
        "avatar_initials": "JT",
        "avatar_color": "from-emerald-500 to-emerald-700",
        "earned_amount": "$1,240",
        "months_active": 6,
        "quote": "Best consistent side income I've found online. Withdrawals hit my wallet within hours — I've cashed out 11 times already.",
        "sort_order": 2,
    },
    {
        "name": "Priya M.",
        "avatar_initials": "PM",
        "avatar_color": "from-pink-500 to-pink-700",
        "earned_amount": "$680",
        "months_active": 4,
        "quote": "The tasks are simple and the payouts are 100% legitimate. I've withdrawn over $600 in USDT. No delays, no excuses.",
        "sort_order": 3,
    },
    {
        "name": "David L.",
        "avatar_initials": "DL",
        "avatar_color": "from-amber-500 to-amber-700",
        "earned_amount": "$890",
        "months_active": 5,
        "quote": "Referred 3 friends and we all earn together now. The referral bonus alone covered my VIP upgrade cost in the first week.",
        "sort_order": 4,
    },
    {
        "name": "Anna R.",
        "avatar_initials": "AR",
        "avatar_color": "from-cyan-500 to-cyan-700",
        "earned_amount": "$2,100",
        "months_active": 8,
        "quote": "8 months and still earning strong. VIP 3 is absolutely worth it — on good days I'm pulling in $80 to $120 USDT.",
        "sort_order": 5,
    },
    {
        "name": "Carlos M.",
        "avatar_initials": "CM",
        "avatar_color": "from-rose-500 to-rose-700",
        "earned_amount": "$530",
        "months_active": 3,
        "quote": "Skeptical at first, but after my first withdrawal landed in my wallet I was completely hooked. Totally legit platform.",
        "sort_order": 6,
    },
    {
        "name": "Mei L.",
        "avatar_initials": "ML",
        "avatar_color": "from-indigo-500 to-indigo-700",
        "earned_amount": "$760",
        "months_active": 5,
        "quote": "I do the tasks during my lunch break. 30 minutes a day and I've built up $760 in less than 5 months. No catches.",
        "sort_order": 7,
    },
    {
        "name": "Tariq H.",
        "avatar_initials": "TH",
        "avatar_color": "from-teal-500 to-teal-700",
        "earned_amount": "$1,580",
        "months_active": 7,
        "quote": "I was looking for a side hustle that didn't require upfront investment. This exceeded every expectation I had.",
        "sort_order": 8,
    },
    {
        "name": "Natasha V.",
        "avatar_initials": "NV",
        "avatar_color": "from-orange-500 to-orange-700",
        "earned_amount": "$310",
        "months_active": 2,
        "quote": "Only 2 months in and already at $310. The onboarding is smooth and the support team is incredibly responsive.",
        "sort_order": 9,
    },
    {
        "name": "Ryan O.",
        "avatar_initials": "RO",
        "avatar_color": "from-blue-500 to-blue-700",
        "earned_amount": "$3,400",
        "months_active": 11,
        "quote": "11 months and over $3,400 earned. I've tried every platform — this is the only one that actually pays consistently.",
        "sort_order": 10,
    },
    {
        "name": "Fatima A.",
        "avatar_initials": "FA",
        "avatar_color": "from-pink-500 to-rose-700",
        "earned_amount": "$945",
        "months_active": 6,
        "quote": "The tasks reset daily so there's always fresh earning opportunities. I love the structure and the transparent payout system.",
        "sort_order": 11,
    },
    {
        "name": "Liam B.",
        "avatar_initials": "LB",
        "avatar_color": "from-emerald-500 to-cyan-700",
        "earned_amount": "$1,120",
        "months_active": 7,
        "quote": "Solid passive-like income. I spend about 45 minutes daily and earn more per hour than my part-time retail job.",
        "sort_order": 12,
    },
    {
        "name": "Yuki N.",
        "avatar_initials": "YN",
        "avatar_color": "from-violet-500 to-pink-600",
        "earned_amount": "$490",
        "months_active": 3,
        "quote": "Super transparent — every transaction is logged and withdrawals process fast. I feel safe keeping my earnings here.",
        "sort_order": 13,
    },
    {
        "name": "Marcus E.",
        "avatar_initials": "ME",
        "avatar_color": "from-amber-500 to-rose-600",
        "earned_amount": "$2,750",
        "months_active": 9,
        "quote": "Upgraded to VIP 3 in month 4 and my daily earnings almost tripled. Best investment decision I've made this year.",
        "sort_order": 14,
    },
    {
        "name": "Aisha K.",
        "avatar_initials": "AK",
        "avatar_color": "from-cyan-500 to-indigo-700",
        "earned_amount": "$620",
        "months_active": 4,
        "quote": "I recommended this to my sister and now we both earn daily. The referral system is a bonus on top of an already great platform.",
        "sort_order": 15,
    },
]


class Command(BaseCommand):
    help = "Seed 15 sample member stories for the public landing page."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing member stories before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = MemberStory.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing stories."))

        created = 0
        skipped = 0
        for data in STORIES:
            _, was_created = MemberStory.objects.get_or_create(
                name=data["name"],
                defaults={**data, "is_active": True},
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {created} created, {skipped} already existed."
            )
        )
