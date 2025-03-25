import array
import random
from typing import Callable, TypeVar
from django.http import JsonResponse

T = TypeVar('T')

def oneOf(*lambdas: Callable[[], T]) -> T:
    return lambdas[random.randint(0, len(lambdas) - 1)]()

# Please enjoy my cursed random JSON generator:
def create_request_json():
    return JsonResponse(
        oneOf(
            lambda: {
                'type': 'response',
                'data': oneOf(
                    lambda: {},
                    lambda: [i + 1 for i in range(random.randint(1, 6))],
                    lambda: {
                        'message': oneOf(
                            lambda: 'Hello!',
                            lambda: 'Hi!',
                            lambda: 'I am the server.',
                            lambda: 'This is a message.',
                            lambda: 'Can you hear me?',
                        ),
                    },
                    lambda: {
                        'items': [oneOf(
                            lambda: oneOf(
                                lambda: {
                                    'type': 'image',
                                    'href': oneOf(
                                        lambda: '/cloud.png',
                                        lambda: '/json.svg',
                                        lambda: '/cool.png',
                                        lambda: '/admin/yeah.svg',
                                    ),
                                },
                                lambda: {
                                    'type': 'link',
                                    'to': oneOf(
                                        lambda: 'google.com',
                                        lambda: 'dice.org',
                                        lambda: '#',
                                        lambda: 'github',
                                    ),
                                },
                                lambda: {
                                    'type': 'text',
                                    'text': oneOf(
                                        lambda: 'This is filler',
                                        lambda: 'Below is cool',
                                        lambda: 'Title',
                                        lambda: '<Insert>',
                                        lambda: 'Read me!',
                                    ),
                                },
                            ),
                        ) for i in range(random.randint(1, 3))],
                    },
                ),
            },
        )
    )